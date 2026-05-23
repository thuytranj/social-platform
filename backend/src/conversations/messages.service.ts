import { BadRequestException, Injectable, UploadedFile } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Message, MessageType } from "./entities/message.entity";
import { DataSource, EntityManager, Repository, In } from "typeorm";
import { Reaction, ReactionTargetType } from "@/reactions/entities/reaction.entity";
import { CreateMessageDto } from "./dto/create-message.dto";
import { CloudinaryService } from "@/integrations/cloudinary.service";
import { Folder } from "@/common/constants/constants";
import { SupabaseService } from "@/supabase/supabase.service";
import { Bucket } from "@/supabase/entities/file.entity";
import { FilesService } from "@/supabase/files.service";
import { Media } from "@/medias/entities/media.entity";
import { Message_Media } from "./entities/message-medias.entity";
import { MediasService } from "@/medias/medias.service";
import { Conversation } from "./entities/conversation.entity";
import { plainToInstance } from "class-transformer";
import { MessageResponseDto } from "./dto/message-response.dto";
import { ConversationMembersService } from "./conversation-members.service";

@Injectable()
export class MessagesService {
  constructor (
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly supabaseService: SupabaseService,
    private readonly filesService: FilesService,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(Message_Media)
    private readonly messageMediaRepository: Repository<Message_Media>,
    private readonly mediasService: MediasService,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly conversationMembersService: ConversationMembersService,
  ) {}

  private getMessageRepository(manager?: EntityManager) {
    return manager?.getRepository(Message) ?? this.messageRepository;
  }

  private getConversationRepository(manager?: EntityManager) {
    return manager?.getRepository(Conversation) ?? this.conversationRepository;
  }

  private getMediaRepository(manager?: EntityManager) {
    return manager?.getRepository(Media) ?? this.mediaRepository;
  }

  private getMessageMediaRepository(manager?: EntityManager) {
    return manager?.getRepository(Message_Media) ?? this.messageMediaRepository;
  }

  private executeTransaction = async <T>(
    callback: (manager: EntityManager) => Promise<T>,
  ): Promise<T> => {
    return this.dataSource.transaction<T>(callback);
  };

  private async emitUpdates(message: Message, conversationId: string, manager?: EntityManager) {
    const conversationRepo = this.getConversationRepository(manager);

    await conversationRepo.update(conversationId, {
      last_message_id: message.id,
      last_message_time: message.sent_at
    });
  }

  async createMessage(createMessageDto: CreateMessageDto, senderId: string, files?: Express.Multer.File[]) {
    let uploadMedias: any = null, uploadFiles: any = null;

    if (files && files.length > 0) {
      const mediaFiles = files.filter(file => (file.mimetype.startsWith('image') || file.mimetype.startsWith('video')))
      const fileEntity = files.filter(file => file.mimetype.startsWith('application'))
      
      if (mediaFiles.length>0) {
        uploadMedias = await Promise.all(
          mediaFiles.map(async(file) => {
            return this.cloudinaryService.uploadFile(file, Folder.MESSAGES)
          })
        )
      }
      
      if (fileEntity.length > 0) {
        uploadFiles = await Promise.all(
          fileEntity.map(async(file) => {
            return this.supabaseService.uploadFile(Bucket.MESSAGES, file)
          })
        )
      }

    }

    try {
      return this.executeTransaction(async(manager) => {
      const messageRepo = this.getMessageRepository(manager);
      const isMember = await this.conversationMembersService.checkIsMember(createMessageDto.conversation_id, senderId, manager);

      if (!isMember) {
        throw new BadRequestException('You are not a member of this conversation');
      }

      const message = messageRepo.create({
        ...createMessageDto,
        conversation_id: createMessageDto.conversation_id,
        sender_id: senderId,
      });

      const savedMessage = await messageRepo.save(message);

      if (uploadMedias && uploadMedias.length > 0) {
        const mediaRepo = this.getMediaRepository(manager);
        const messageMediaRepo = this.getMessageMediaRepository(manager);

        const mediaEntities = uploadMedias.map((uploadMedia) => {
          return mediaRepo.create({
            url: uploadMedia.secure_url,
            public_id: uploadMedia.public_id,
            type: this.mediasService.mapMediaType(uploadMedia.resource_type, uploadMedia.format),
            resource_type: uploadMedia.resource_type,
            format: uploadMedia.format,
            bytes: uploadMedia.bytes,
            width: uploadMedia.width,
            height: uploadMedia.height,
            duration: uploadMedia.duration ?? null,
          })
        })

        const savedMedias = await mediaRepo.save(mediaEntities);

        const messageMediaEntities = savedMedias.map((media) => {
          return messageMediaRepo.create({
            media_id: media.id,
            message_id: savedMessage.id,
          })
        })

        await messageMediaRepo.save(messageMediaEntities);
      }

      if (uploadFiles && uploadFiles.length > 0) {
        await Promise.all(
          uploadFiles.map(async (uploadFile) => {
            await this.filesService.create({
              url: uploadFile.url,
              file_name: uploadFile.file_name,
              original_name: uploadFile.original_name,
              file_size: uploadFile.file_size,
              mime_type: uploadFile.mime_type,
              message_id: savedMessage.id,
            }, manager)
          })
        );
      }

      await this.emitUpdates(savedMessage, createMessageDto.conversation_id, manager);
      const savedMessageFull = await messageRepo.createQueryBuilder('messages')
        .leftJoinAndSelect('messages.reply_message', 'reply_message')
        .leftJoinAndSelect('messages.sender', 'sender')
        .leftJoinAndSelect('sender.profile', 'profile')
        .leftJoinAndSelect('messages.message_medias', 'message_medias')
        .leftJoinAndSelect('message_medias.media', 'media')
        .leftJoinAndSelect('messages.files', 'files')
        .where('messages.id = :id', { id: savedMessage.id })
        .getOne();
        
      return plainToInstance(MessageResponseDto, {...savedMessageFull, medias: savedMessageFull?.message_medias?.map((messageMedia) => messageMedia.media) ?? []}, {
        excludeExtraneousValues: true,
      });
    })
    } catch (error) {
      if (uploadMedias && uploadMedias.length>0) {
        await Promise.all(uploadMedias.map(media => this.cloudinaryService.deleteFile(media.public_id, media.resource_type)))
      }

      if (uploadFiles && uploadFiles.length > 0) {
        await Promise.all(uploadFiles.map(file => this.supabaseService.deleteFile(file.file_name, Bucket.MESSAGES)))
      }
      
      throw error;
    }
  }

  async getMessages(conversationId: string, userId: string, limit: number=20, cursor?: string) {
    try {
      const messageRepo = this.getMessageRepository();

      const isMember = await this.conversationMembersService.checkIsMember(conversationId, userId);
      if (!isMember) {
        throw new BadRequestException('You are not a member of this conversation');
      }

      const queryBuilder = messageRepo.createQueryBuilder('messages')
        .select(['messages.id', 'messages.sent_at'])
        .where('messages.conversation_id = :conversationId', { conversationId })
        .orderBy('messages.sent_at', 'DESC')
        .addOrderBy('messages.id', 'DESC')
        .limit(limit + 1);

      if (cursor) {
        const {id, sent_at} = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        queryBuilder.andWhere(
          `(
            messages.sent_at < :cursorSentAt OR 
            (messages.sent_at = :cursorSentAt AND messages.id < :cursorId)
          )`,
          {
            cursorSentAt: sent_at,
            cursorId: id,
          }
        );
      }

      const idsResult = await queryBuilder.getRawMany();
      if (idsResult.length===0) return {
        data: [],
        nextCursor: null
      }

      let nextCursor: string | null = null;
      if (idsResult.length > limit) {
        idsResult.pop();

        const lastItem = idsResult[idsResult.length-1];
        nextCursor = Buffer.from(JSON.stringify({id: lastItem.messages_id, sent_at: lastItem.messages_sent_at})).toString('base64')
      }

      const messages = await messageRepo.createQueryBuilder('messages')
        .leftJoinAndSelect('messages.reply_message', 'reply_message')
        .leftJoinAndSelect('messages.sender', 'sender')
        .leftJoinAndSelect('sender.profile', 'profile')
        .leftJoinAndSelect('messages.message_medias', 'message_medias')
        .leftJoinAndSelect('message_medias.media', 'media')
        .leftJoinAndSelect('messages.files', 'files')
        .where('messages.conversation_id = :conversationId', { conversationId })
        .andWhere('messages.id IN (:...ids)', { ids: idsResult.map((r) => r.messages_id) })
        .orderBy('array_position(ARRAY[:...ids]::uuid[], messages.id)')
        .getMany()

      const messageIds = messages.map(m => m.id);
      let reactions: Reaction[] = [];
      if (messageIds.length > 0) {
        reactions = await this.dataSource.getRepository(Reaction).find({
          where: {
            target_type: ReactionTargetType.MESSAGE,
            target_id: In(messageIds)
          },
          relations: ['author', 'author.profile']
        });
      }

      const reactionsByMessageId = reactions.reduce((acc, rx) => {
        if (!acc[rx.target_id]) {
          acc[rx.target_id] = [];
        }
        acc[rx.target_id].push(rx);
        return acc;
      }, {} as Record<string, Reaction[]>);

      return {
        data: messages.map(message => {
          const messageReactions = reactionsByMessageId[message.id] ?? [];
          return plainToInstance(MessageResponseDto, {
            ...message,
            medias: message.message_medias.map(m => m.media),
            reactions: messageReactions
          }, {excludeExtraneousValues: true});
        }),
        nextCursor,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateMessage(messageId: string, userId: string, content: string) {
    const messageRepo = this.getMessageRepository();
    const message = await messageRepo.findOne({where: {id: messageId}});
    if (!message) {
      throw new BadRequestException('Message not found');
    }
    if (message.sender_id !== userId) {
      throw new BadRequestException('You are not the sender of this message');
    }
    message.content = content;
    await messageRepo.save(message);

    const savedMessage = await messageRepo.findOne({
      where: {id: messageId},
      relations: ['sender', 'sender.profile', 'message_medias', 'message_medias.media', 'files', 'reply_message']
    });

    const messageReactions = await this.dataSource.getRepository(Reaction).find({
      where: {
        target_type: ReactionTargetType.MESSAGE,
        target_id: messageId
      },
      relations: ['author', 'author.profile']
    });

    return plainToInstance(MessageResponseDto, {
      ...savedMessage,
      medias: savedMessage?.message_medias.map(m => m.media) ?? [],
      reactions: messageReactions
    }, {excludeExtraneousValues: true});
  } 

  async deleteMessage(messageId: string, userId: string) {
    const messageRepo = this.getMessageRepository();
    const message = await messageRepo.findOne({where: {id: messageId}});
    if (!message) {
      throw new BadRequestException('Message not found');
    }
    if (message.sender_id !== userId) {
      throw new BadRequestException('You are not the sender of this message');
    }
    message.message_type = MessageType.REVOKED;
    
    await messageRepo.save(message);
    const deletedMessage = await messageRepo.findOne({
      where: {id: messageId},
      relations: ['sender', 'sender.profile', 'message_medias', 'message_medias.media', 'files', 'reply_message']
    });
    return plainToInstance(MessageResponseDto, {...deletedMessage, medias: deletedMessage?.message_medias.map(m => m.media)??[]}, {excludeExtraneousValues: true});
  } 
}