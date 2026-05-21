import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { Media } from "@/medias/entities/media.entity";
import { MediaResponseDto } from '@/medias/entities/media-response.dto';
import { FileResponseDto } from '@/supabase/dto/file-response.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly conversationMemberService: ConversationMembersService,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  private getConversationRepository(manager?: EntityManager) {
    return manager?.getRepository(Conversation) ?? this.conversationRepository;
  }

  private getMediaRepository(manager?: EntityManager) {
    return manager?.getRepository(Media) ?? this.mediaRepository;
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
        
        if (createConversationDto.type === ConversationType.PRIVATE && createConversationDto.member_ids.length !== 1) {
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
      .leftJoin('conversations.members', 'members')
      .addSelect(['members.unread_count'])
      .leftJoinAndSelect('conversations.last_message', 'last_message')
      .leftJoinAndSelect('last_message.sender', 'sender')
      .leftJoinAndSelect('sender.profile', 'sender_profile')
      .where('conversations.id IN (:...ids)', { ids: idsResult.map((conversation) => conversation.id) })
      .andWhere('members.user_id = :userId', { userId })
      .orderBy('array_position(ARRAY[:...ids]::uuid[], conversations.id)')
      .getMany()
    
    return {
      data: conversations.map(conversation => plainToInstance(ConversationResponseDto, {...conversation, unread_count: conversation.members[0].unread_count}, { excludeExtraneousValues: true })),
      nextCursor
    }
  }

  async getConversationMedias(conversationId: string, userId: string, limit: number = 20, cursor?: string) {
    const isMember = await this.conversationMemberService.checkIsMember(conversationId, userId);
    if (!isMember) throw new BadRequestException('You are not a member of this conversation');

    const mediaRepo = this.getMediaRepository()
    
    const query = mediaRepo.createQueryBuilder('medias')
      .innerJoin('medias.message_media', 'message_media')
      .innerJoin('message_media.message', 'message')
      .andWhere('message.conversation_id = :conversationId', { conversationId })
      .select('medias.id', 'id')
      .addSelect('medias.created_at::text', 'created_at')
      .orderBy('medias.created_at', 'DESC')
      .addOrderBy('medias.id', 'DESC')
      .limit(limit + 1);
    
    if (cursor) {
      const { created_at, id } = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as { created_at: string, id: string };
      query.andWhere(
        `(medias.created_at < :created_at OR (medias.created_at = :created_at AND medias.id < :id))`,
        { created_at, id }
      );
    }
    
    const idsResult = await query.getRawMany()
    if (idsResult.length===0) return {data: [], nextCursor: null}
    
    let nextCursor: string | null = null;
    if (idsResult.length > limit) {
      idsResult.pop();
      const lastReturnedMedia = idsResult[idsResult.length - 1];
      if (lastReturnedMedia) {
        nextCursor = Buffer.from(
          JSON.stringify({
            created_at: lastReturnedMedia.created_at,
            id: lastReturnedMedia.id,
          }),
        ).toString('base64');
      }
    }

    const medias = await mediaRepo.createQueryBuilder('medias')
      .andWhere('medias.id IN (:...ids)', { ids: idsResult.map((media) => media.id) })
      .orderBy('array_position(ARRAY[:...ids]::uuid[], medias.id)')
      .getMany()
    
    return { data: medias.map(media => plainToInstance(MediaResponseDto, media, { excludeExtraneousValues: true })), nextCursor }
  }

  async getConversation(conversationId: string, userId: string) {
    const conversationRepo = this.getConversationRepository()
    const isMember = await this.conversationMemberService.getOne(conversationId, userId)
    if (!isMember) throw new BadRequestException('You are not a member of this conversation')
    
    const conversation = await conversationRepo.createQueryBuilder('conversations')
      .leftJoinAndSelect('conversations.creator', 'creator')
      .leftJoinAndSelect('creator.profile', 'creator_profile')
      .where('conversations.id = :conversationId', { conversationId })
      .getOne()
    
    return plainToInstance(ConversationResponseDto, conversation, { excludeExtraneousValues: true })
  } 

  async update(id: string, userId: string, updateConversationDto: UpdateConversationDto, file?: Express.Multer.File) {
    return this.dataSource.transaction(async (transactionManager) => {
      const conversationRepo = this.getConversationRepository(transactionManager)
      const isMember = await this.conversationMemberService.getOne(id, userId, transactionManager)

      if (isMember?.role !== ConversationMemberRole.OWNER) {
        throw new BadRequestException('You are not authorized to update this conversation')
      }

      const conversation = await conversationRepo.findOne({where: {id}})
      if (!conversation) throw new BadRequestException('Conversation not found')

      if (file) {
        if (conversation.thumbnail_public_url) await this.cloudinaryService.deleteFile(conversation.thumbnail_public_url, 'image')
        const uploadMedia = await this.cloudinaryService.uploadFile(file, Folder.CONVERSATION_AVATARS)
        conversation.thumbnail_url = uploadMedia.secure_url
        conversation.thumbnail_public_url = uploadMedia.public_id
      }

      if (updateConversationDto.title) conversation.title = updateConversationDto.title
      
      return await conversationRepo.save(conversation)
    })
  }

  async remove(userId: string, conversationId: string) {
    const conversationRepo = this.getConversationRepository()
    const isMember = await this.conversationMemberService.getOne(conversationId, userId)
    if (!isMember) throw new BadRequestException('You are not a member of this conversation')
    
    if (isMember.role !== ConversationMemberRole.OWNER) {
      throw new BadRequestException('You are not authorized to remove this conversation')
    }
    
    return await conversationRepo.delete(conversationId)
  }
}
