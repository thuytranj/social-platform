import { BadRequestException, Injectable, Inject, forwardRef } from "@nestjs/common";
import { DataSource, EntityManager, Repository, } from "typeorm";
import { ConversationMember, ConversationMemberRole } from "./entities/conversation-member.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CloudinaryService } from "@/integrations/cloudinary.service";
import { CreateConversationMemberDto } from "./dto/create-conversation-member.dto";
import { UsersService } from "@/users/users.service";
import { plainToInstance } from "class-transformer";
import { ConversationMemberResponseDto } from "./dto/conversation-member-response.dto";
import { ConversationType } from "./entities/conversation.entity";

@Injectable() 
export class ConversationMembersService {
  constructor(
    @InjectRepository(ConversationMember)
    private readonly conversationMemberRepository: Repository<ConversationMember>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService
  ) {}

  private getConversationMemberRepository(manager?: EntityManager) {
    return manager?.getRepository(ConversationMember) ?? this.conversationMemberRepository;
  }

  private executeTransaction<T>(
    manager: EntityManager | undefined,
    callback: (transactionManager: EntityManager) => Promise<T>,
  ) {
    return manager ? callback(manager) : this.dataSource.transaction(callback);
  }

  async create(createConversationMemberDto: CreateConversationMemberDto, manager?: EntityManager) {
    return this.executeTransaction(manager, async (transactionManager) => {
      const conversationMembersRepo = this.getConversationMemberRepository(transactionManager)

      const existingUser = await this.usersService.findOneByIdRaw(createConversationMemberDto.user_id, transactionManager);
      if (!existingUser) {
        throw new BadRequestException('User not found');
      }
      
      const existingMember = await conversationMembersRepo.findOne({
        where: {
          conversation_id: createConversationMemberDto.conversation_id,
          user_id: createConversationMemberDto.user_id
        }
      })
      if (existingMember) {
        throw new BadRequestException('User already a member of this conversation');
      }

      const newMember = conversationMembersRepo.create(createConversationMemberDto);
      return await conversationMembersRepo.save(newMember);
    })
  }

  async getMembers(
    conversationId: string,
    limit: number = 20,
    cursor?: string,
  ) {
    const idsQueryBuilder = this.conversationMemberRepository
      .createQueryBuilder('conversation_members')
      .select('conversation_members.id', 'id')
      .addSelect('conversation_members.user_id', 'user_id')
      .where(
        'conversation_members.conversation_id = :conversationId',
        { conversationId },
      )
      .orderBy('conversation_members.id', 'DESC')
      .limit(limit + 1);

    if (cursor) {
      const { id } = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      );

      idsQueryBuilder.andWhere(
        `(conversation_members.id)
        < (:id)`,
        {
          id,
        },
      );
    }

    const idsResult = await idsQueryBuilder.getRawMany();

    if (idsResult.length === 0) {
      return {
        data: [],
        nextCursor: null,
      };
    }

    let nextCursor: string | null = null;

    if (idsResult.length > limit) {
      idsResult.pop();
      const lastReturnedMember = idsResult[idsResult.length - 1];

      if (lastReturnedMember) {
        nextCursor = Buffer.from(
          JSON.stringify({
            id: lastReturnedMember.id,
          }),
        ).toString('base64');
      }
    }

    const userIds = idsResult.map((member) => member.user_id);

    const members = await this.conversationMemberRepository
      .createQueryBuilder('conversation_members')
      .leftJoinAndSelect('conversation_members.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where(
        'conversation_members.conversation_id = :conversationId',
        { conversationId },
      )
      .andWhere('user.id IN (:...userIds)', { userIds })
      .orderBy('array_position(ARRAY[:...userIds]::uuid[], user.id)')
      .getMany();

    return {
      data: members.map((member) =>
        plainToInstance(
          ConversationMemberResponseDto,
          member,
          {
            excludeExtraneousValues: true,
          },
        ),
      ),
      nextCursor,
    };
  }

  // async getOne(conversationId: string, userId: string, manager?: EntityManager) {
  //   const conversationMembersRepo = this.getConversationMemberRepository(manager);
  //   return await conversationMembersRepo.findOne({
  //     where: {
  //       conversation_id: conversationId,
  //       user_id: userId
  //     },
  //   })
  // }

  async addMember(conversationId: string, userId: string, memberId: string) {
    return this.dataSource.transaction(async (manager) => {
      const conversationMembersRepo = this.getConversationMemberRepository(manager);
      
      const isOwner = await conversationMembersRepo.findOne({
        where: {
          conversation_id: conversationId,
          user_id: userId,
          role: ConversationMemberRole.OWNER
        },
        relations: ['conversation']
      })
      if (!isOwner || isOwner.conversation.type !== ConversationType.GROUP) {
        throw new BadRequestException('You do not have permission to add member to this group.');
      }

      return await this.create({conversation_id: conversationId, user_id: memberId, role: ConversationMemberRole.MEMBER}, manager);
    })
  }

  async removeMember(conversationId: string, userId: string, memberId: string) {
    return this.dataSource.transaction(async (manager) => {
      const conversationMembersRepo = this.getConversationMemberRepository(manager);
      
      if (userId === memberId) {
        throw new BadRequestException('You cannot remove yourself from this group.');
      }

      const isOwner = await conversationMembersRepo.findOne({
        where: {
          conversation_id: conversationId,
          user_id: userId,
          role: ConversationMemberRole.OWNER
        },
        relations: ['conversation']
      })
      if (!isOwner || isOwner.conversation.type !== ConversationType.GROUP) {
        throw new BadRequestException('You do not have permission to remove member from this group.');
      }

      return await conversationMembersRepo.delete({
        conversation_id: conversationId,
        user_id: memberId
      });
    })
  }

  async transferOwnership(conversationId: string, currentOwnerId: string, newOwnerId: string) {
    return this.dataSource.transaction(async (manager) => {
      const conversationMembersRepo = this.getConversationMemberRepository(manager);
      
      const isOwner = await conversationMembersRepo.findOne({
        where: {
          conversation_id: conversationId,
          user_id: currentOwnerId,
          role: ConversationMemberRole.OWNER
        },
        relations: ['conversation']
      })
      if (!isOwner || isOwner.conversation.type !== ConversationType.GROUP) {
        throw new BadRequestException('You do not have permission to transfer ownership of this group.');
      }

      await conversationMembersRepo.update({
        conversation_id: conversationId,
        user_id: currentOwnerId
      }, { role: ConversationMemberRole.MEMBER });

      return await conversationMembersRepo.update({
        conversation_id: conversationId,
        user_id: newOwnerId
      }, { role: ConversationMemberRole.OWNER });
    })
  }

  async leaveConversation(conversationId: string, userId: string) {
    const conversationMemberRepo = this.getConversationMemberRepository();

    const member = await conversationMemberRepo.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId
      },
      relations: ['conversation']
    })
    if (!member) {
      throw new BadRequestException('You are not a member of this group/conversation.');
    }

    if (member.conversation.type !== ConversationType.GROUP) {
      throw new BadRequestException('Conversation is not a group.');
    }

    if (member.role === ConversationMemberRole.OWNER) {
      throw new BadRequestException('You must transfer the ownership of this group to another member before leaving.');
    }

    return await conversationMemberRepo.delete({
      conversation_id: conversationId,
      user_id: userId
    });
  }

  async checkIsMember(conversationId: string, userId: string, manager?: EntityManager) {
    const conversationMemberRepo = this.getConversationMemberRepository(manager);
    return await conversationMemberRepo.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId
      }
    })
  }
}