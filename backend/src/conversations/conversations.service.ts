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

  findAll() {
    return `This action returns all conversations`;
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
