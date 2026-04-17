import { BadRequestException, Injectable } from '@nestjs/common';
import { GroupMember } from './entities/group-member.entity';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';
import { UsersService } from '@/users/users.service';
import { GroupsService } from './groups.service';
import { GroupRole, GroupMemberStatus } from './entities/group-member.entity';
import { plainToInstance } from 'class-transformer';
import { GroupMemberResponseDto } from './dto/group-member-response.dto';
import { Group } from './entities/group.entity';

@Injectable()
export class GroupMemberService {
  constructor(
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private readonly usersService: UsersService,
  ) {}

  private getGroupMemberRepository(manager?: any): Repository<GroupMember> {
    return manager?.getRepository(GroupMember) ?? this.groupMemberRepository;
  }

  private getGroupRepository(manager?: any): Repository<Group> {
    return manager?.getRepository(Group) ?? this.groupRepository;
  } 

  private excuteTransaction<T>(
    manager: EntityManager | undefined,
    callback: (transactionalEntityManager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return manager
      ? callback(manager)
      : this.groupMemberRepository.manager.transaction(callback);
  }

  async create(
    userId: string,
    groupMember: CreateGroupMemberDto,
    manager?: EntityManager,
  ) {
    return this.excuteTransaction(manager, async (transactionManager) => {
      const { group_id, role, status } = groupMember;
      const user = await this.usersService.findOneByIdRaw(userId, transactionManager);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const groupRepo = this.getGroupRepository(transactionManager);
      const group = await groupRepo.findOne({ where: { id: group_id } });
      if (!group) {
        throw new BadRequestException('Group not found');
      }

      const groupMemberRepository = this.getGroupMemberRepository(transactionManager);

      const existingMembership = await groupMemberRepository.findOne({
        where: { group_id, user_id: userId },
      });
      if (existingMembership) {
        throw new BadRequestException('User is already a member of the group');
      }

      const newGroupMember = groupMemberRepository.create({
        group_id,
        user_id: userId,
        role: role || GroupRole.MEMBER,
        status: status || GroupMemberStatus.ACTIVE,
      });

      if (newGroupMember.status === GroupMemberStatus.ACTIVE) {
        await groupRepo.increment({ id: group_id }, 'members_count', 1);
      }
      
      return await groupMemberRepository.save(newGroupMember);
    });
  }

  async findAllMembers(
    userId: string,
    groupId: string,
    limit: number = 10,
    cursor?: string,
    manager?: EntityManager,
  ) {
    const groupMemberRepository = this.getGroupMemberRepository(manager);

    const isMember = await groupMemberRepository.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        status: GroupMemberStatus.ACTIVE,
      },
    });
    if (!isMember) {
      throw new BadRequestException('User is not a member of the group');
    }

    const idsQuery = groupMemberRepository
      .createQueryBuilder('group_members')
      .select('group_members.user_id', 'user_id')
      .addSelect('group_members.joined_at', 'joined_at')
      .where('group_members.group_id = :groupId', { groupId })
      .orderBy('group_members.joined_at', 'DESC')
      .addOrderBy('group_members.user_id', 'DESC')
      .limit(limit + 1);

    if (cursor) {
      const { user_id, joined_at } = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      );
      idsQuery.andWhere(
        '(group_members.user_id > :user_id OR (group_members.user_id = :user_id AND group_members.joined_at > :joined_at))',
        { user_id, joined_at },
      );
    }

    const idsResult = await idsQuery.getRawMany();
    let nextCursor: string | null = null;

    if (idsResult.length === 0) {
      return { members: [], nextCursor };
    }

    if (idsResult.length > limit) {
      idsResult.pop();
      const cursorTarget = idsResult[idsResult.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          user_id: cursorTarget.user_id,
          joined_at: cursorTarget.joined_at,
        }),
      ).toString('base64');
    }

    const userIds = idsResult.map((r) => r.user_id);
    const members = await groupMemberRepository
      .createQueryBuilder('group_members')
      .innerJoin('group_members.user', 'user')
      .leftJoin('user.profile', 'profile')
      .select([
        'group_members.id',
        'group_members.role',
        'group_members.status',
        'group_members.joined_at',
        'user.id',
        'user.username',
        'user.email',
        'profile.avatar_url',
      ])
      .where('group_members.group_id = :groupId', { groupId })
      .andWhere('group_members.user_id IN (:...userIds)', { userIds })
      .getMany();

    return {
      data: members.map((m) =>
        plainToInstance(GroupMemberResponseDto, m, {
          excludeExtraneousValues: true,
        }),
      ),
      nextCursor: null,
    };
  }
}
