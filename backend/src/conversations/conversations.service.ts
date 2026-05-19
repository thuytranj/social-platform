import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation, ConversationType } from './entities/conversation.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CloudinaryService } from '@/integrations/cloudinary.service';
import { Folder } from '@/common/constants/constants';
import { ConversationMembersService } from './conversation-members.service';
import { CreateConversationMemberDto } from './dto/create-conversation-member.dto';
import { ConversationMemberRole } from './entities/conversation-member.entity';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly conversationMemberService: ConversationMembersService
  ) {}

  private getConversationRepository(manager?: EntityManager) {
    return manager?.getRepository(Conversation) ?? this.conversationRepository;
  }

  private executeTransaction<T>(
    manager: EntityManager | undefined,
    callback: (transactionManager: EntityManager) => Promise<T>,
  ) {
    return manager ? callback(manager) : this.dataSource.transaction(callback);
  }

  async create(createConversationDto: CreateConversationDto, creatorId: string, file?: Express.Multer.File, manager?: EntityManager) {
    const uploadMedia = file ? await this.cloudinaryService.uploadFile(file, Folder.CONVERSATION_AVATARS) : undefined;

    try {
      return this.dataSource.transaction(async (transactionManager) => {
        const conversationRepo = this.getConversationRepository(transactionManager);
        
        if (createConversationDto.type === ConversationType.PRIVATE && createConversationDto.member_ids.length > 1) {
          throw new BadRequestException('Private conversation must have exactly 2 members')
        }

        if (createConversationDto.type === ConversationType.PRIVATE && await this.existingConversation(createConversationDto.member_ids[0], creatorId, transactionManager)) {
          throw new BadRequestException('Conversation already exists')
        }

        const privateKey = (creatorId < createConversationDto.member_ids[0]) ? creatorId + '-' + createConversationDto.member_ids[0] : createConversationDto.member_ids[0] + '-' + creatorId;
        
        const conversation = conversationRepo.create({
          ...createConversationDto,
          creator_id: creatorId,
          thumbnail_url: uploadMedia?.secure_url,
          thumbnail_public_url: uploadMedia?.public_id,
          private_key: createConversationDto.type === ConversationType.PRIVATE ? privateKey : undefined,
          last_message_time: new Date(),
        })

        const savedConversation = await conversationRepo.save(conversation);
        
        const memberPromises = createConversationDto.member_ids.map((member_id) => {
          const createConversationMemberDto: CreateConversationMemberDto = {
            conversation_id: savedConversation.id,
            user_id: member_id,
            role: ConversationMemberRole.MEMBER
          }
          return this.conversationMemberService.create(createConversationMemberDto, transactionManager)
        })
        await Promise.all(memberPromises);

        await this.conversationMemberService.create({conversation_id: savedConversation.id, user_id: creatorId, role: ConversationMemberRole.OWNER}, transactionManager)

        return savedConversation;
      });
    } catch (error) {
      if(uploadMedia) this.cloudinaryService.deleteFile(uploadMedia.public_id, uploadMedia.resource_type);
      throw error;
    }
  }

  async existingConversation (userId_1: string, userId_2: string, manager?: EntityManager) {
    const conversationRepo = this.getConversationRepository(manager)

    const key = (user1: string, user2: string) => user1 < user2 ? `${user1}-${user2}` : `${user2}-${user1}`
    const conversation = await conversationRepo.findOne({where: {private_key: key(userId_1, userId_2)}})
    
    return conversation;
  } 

  async getConversations(userId: string, limit: number = 20, cursor?: string) {
    const conversationRepo = this.getConversationRepository()

    const queryBuilder = conversationRepo.createQueryBuilder('conversations')
      .select(['conversations.id', 'conversations.last_message_time'])
      .innerJoin('conversations.members', 'members')
      .where('members.user_id = :userId', { userId })
      .orderBy('conversations.last_message_time', 'DESC')
      .addOrderBy('conversations.id', 'DESC')
      .limit(limit + 1);
    
    if (cursor) {
      const { last_message_time, id } = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as { last_message_time: string, id: string };
      queryBuilder.andWhere(
        `(conversations.last_message_time < :last_message_time OR (conversations.last_message_time = :last_message_time AND conversations.id < :id))`,
        { last_message_time, id }
      );
    }
    
    const idsResult = await queryBuilder.getMany()
    console.log('idsResult', idsResult);
    if (idsResult.length===0) return {data: [], nextCursor: null}
    
    let nextCursor: string | null = null;
    if (idsResult.length > limit) {
      idsResult.pop();
      const lastReturnedConversation = idsResult[idsResult.length - 1];
      if (lastReturnedConversation) {
        nextCursor = Buffer.from(
          JSON.stringify({
            last_message_time: lastReturnedConversation.last_message_time,
            id: lastReturnedConversation.id,
          }),
        ).toString('base64');
      }
    }

    const conversations = await conversationRepo.createQueryBuilder('conversations')
      .leftJoinAndSelect('conversations.last_message', 'last_message')
      .leftJoinAndSelect('last_message.sender', 'sender')
      .leftJoinAndSelect('sender.profile', 'sender_profile')
      .where('conversations.id IN (:...ids)', { ids: idsResult.map((conversation) => conversation.id) })
      .orderBy('array_position(ARRAY[:...ids]::uuid[], conversations.id)')
      .getMany()
    
    return {
      data: conversations.map(conversation => plainToInstance(ConversationResponseDto, conversation, { excludeExtraneousValues: true })),
      nextCursor
    }
    
  }

  findOne(id: number) {
    return `This action returns a #${id} conversation`;
  }

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return `This action updates a #${id} conversation`;
  }

  remove(id: number) {
    return `This action removes a #${id} conversation`;
  }
}
