import { BadRequestException, Injectable } from "@nestjs/common";
import { DataSource, EntityManager, Repository, } from "typeorm";
import { ConversationMember } from "./entities/conversation-member.entity";
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


  findOne(id: number) {
    return `This action returns a #${id} conversation`;
  }

  remove(id: number) {
    return `This action removes a #${id} conversation`;
  }
}