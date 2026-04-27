import { BadRequestException, Injectable } from '@nestjs/common';
import { GroupMember } from './entities/group-member.entity';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';
import { GroupRole, GroupMemberStatus } from './entities/group-member.entity';
import { plainToInstance } from 'class-transformer';
import { GroupMemberResponseDto } from './dto/group-member-response.dto';
import { Group } from './entities/group.entity';
import { User } from '@/users/entities/user.entity';
import { GroupPrivacy } from './entities/group.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class GroupMemberService {
  constructor(
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  private getGroupMemberRepository(manager?: any): Repository<GroupMember> {
    return manager?.getRepository(GroupMember) ?? this.groupMemberRepository;
  }

  private getGroupRepository(manager?: any): Repository<Group> {
    return manager?.getRepository(Group) ?? this.groupRepository;
  }

  private getUsersRepository(manager?: any): Repository<User> {
    return manager?.getRepository(User) ?? this.userRepository;
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
      const usersRepo = this.getUsersRepository(transactionManager);
      const user = await usersRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const groupRepo = this.getGroupRepository(transactionManager);
      const group = await groupRepo.findOne({ where: { id: group_id } });
      if (!group) {
        throw new BadRequestException('Group not found');
      }

      const groupMemberRepository =
        this.getGroupMemberRepository(transactionManager);

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
    role?: GroupRole,
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

    if (role) {
      idsQuery.andWhere('group_members.role = :role', { role });
    }

    if (cursor) {
      const { user_id, joined_at } = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      );
      idsQuery.andWhere(
        '(group_members.joined_at < :joined_at OR (group_members.joined_at = :joined_at AND group_members.user_id < :user_id))',
        { joined_at: new Date(joined_at), user_id },
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
    const membersQb = groupMemberRepository
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

    if (role) {
      membersQb.andWhere('group_members.role = :role', { role });
    }
    const members = await membersQb.getMany();

    return {
      data: members.map((m) =>
        plainToInstance(GroupMemberResponseDto, m, {
          excludeExtraneousValues: true,
        }),
      ),
      nextCursor,
    };
  }

  async joinGroup(userId: string, groupId: string) {
    const groupRepo = this.getGroupRepository();
    const group = await groupRepo.findOne({ where: { id: groupId } });

    if (!group) {
      throw new BadRequestException('Group not found');
    }

    const status =
      group.privacy === GroupPrivacy.PRIVATE
        ? GroupMemberStatus.PENDING
        : GroupMemberStatus.ACTIVE;

    const newGroupMember = await this.create(userId, {
      group_id: groupId,
      role: GroupRole.MEMBER,
      status,
    });

    return {
      message:
        status === GroupMemberStatus.ACTIVE
          ? 'Joined group successfully'
          : 'Join request sent, waiting for approval',
      groupMember: newGroupMember,
    };
  }

  async leaveGroup(userId: string, groupId: string) {
    return this.dataSource.transaction(async (manager) => {
      const groupMemberRepo = this.getGroupMemberRepository(manager);

      const membership = await groupMemberRepo.findOne({
        where: {
          group_id: groupId,
          user_id: userId,
          status: GroupMemberStatus.ACTIVE,
        },
      });

      if (!membership) {
        throw new BadRequestException('User is not a member of the group');
      }

      if (membership.role === GroupRole.OWNER) {
        throw new BadRequestException('Group owner cannot leave the group');
      }

      if (membership.role === GroupRole.ADMIN) {
        const countAdmins = await groupMemberRepo.count({
          where: {
            group_id: groupId,
            role: GroupRole.ADMIN,
            status: GroupMemberStatus.ACTIVE,
          },
        });

        if (countAdmins <= 1) {
          throw new BadRequestException(
            'Cannot leave group: must have at least one admin',
          );
        }
      }

      await groupMemberRepo.remove(membership);
      const groupRepo = this.getGroupRepository(manager);
      await groupRepo.decrement({ id: groupId }, 'members_count', 1);

      return { message: 'Left group successfully' };
    });
  }

  async removeMember (actorId: string, userId: string, groupId: string) {
    if (actorId === userId) {
      throw new BadRequestException('You cannot remove yourself');
    }

    return this.dataSource.transaction(async (manager) => {
      const groupMembersRepo = this.getGroupMemberRepository(manager);
      const isActorOwnerOrAdmin = await groupMembersRepo.findOne({
        where: {
          group_id: groupId,
          user_id: actorId,
          role: In([GroupRole.OWNER, GroupRole.ADMIN]),
          status: GroupMemberStatus.ACTIVE,
        },
      })

      if (!isActorOwnerOrAdmin) {
        throw new BadRequestException('You are not admin or owner of the group');
      }

      const targetMember = await groupMembersRepo.findOne({
        where: {
          group_id: groupId,
          user_id: userId,
          status: GroupMemberStatus.ACTIVE,
        },
      });

      if (!targetMember) {
        throw new BadRequestException('Target user is not a member of the group');
      }

      if (targetMember.role === GroupRole.OWNER) {
        throw new BadRequestException('Cannot remove group owner');
      }
      
      if (targetMember.role === GroupRole.ADMIN && isActorOwnerOrAdmin.role === GroupRole.ADMIN) {
        throw new BadRequestException('Cannot remove group admin');
      }

      await groupMembersRepo.remove(targetMember);

      const groupRepo = this.getGroupRepository(manager);
      await groupRepo.decrement({ id: groupId }, 'members_count', 1);

      return { message: 'Removed member successfully' };
    })
  }

  async transferOwnership(
    ownerId: string,
    groupId: string,
    newOwnerId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const groupRepo = this.getGroupRepository(manager);
      const groupMemberRepo = this.getGroupMemberRepository(manager);

      const oldOwnerMembership = await groupMemberRepo.findOne({
        where: {
          group_id: groupId,
          user_id: ownerId,
          role: GroupRole.OWNER,
          status: GroupMemberStatus.ACTIVE,
        },
      });

      if (!oldOwnerMembership) {
        throw new BadRequestException('You are not the owner of the group');
      }

      const newOwnerMembership = await groupMemberRepo.findOne({
        where: {
          group_id: groupId,
          user_id: newOwnerId,
          status: GroupMemberStatus.ACTIVE,
        },
      });

      if (!newOwnerMembership) {
        throw new BadRequestException(
          'New owner must be an active member of the group',
        );
      }

      oldOwnerMembership.role = GroupRole.MEMBER;
      newOwnerMembership.role = GroupRole.OWNER;

      await groupMemberRepo.save([oldOwnerMembership, newOwnerMembership]);
      await groupRepo.update({ id: groupId }, { creator_id: newOwnerId });

      return { message: 'Group ownership transferred successfully' };
    });
  }

  async addAdmin(actorId: string, userId: string, groupId: string) {
    const groupMembersRepo = this.getGroupMemberRepository();

    const isOwner = await groupMembersRepo.findOne({
      where: {
        group_id: groupId,
        user_id: actorId,
        role: GroupRole.OWNER,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!isOwner) {
      throw new BadRequestException('You are not the owner of the group');
    }

    const userMembership = await groupMembersRepo.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!userMembership) {
      throw new BadRequestException(
        'User must be an active member of the group',
      );
    }

    if (userMembership.role === GroupRole.ADMIN || userMembership.role === GroupRole.OWNER) {
      throw new BadRequestException('User is already an admin or owner of the group');
    }

    userMembership.role = GroupRole.ADMIN;
    await groupMembersRepo.save(userMembership);

    return { message: 'User added as admin successfully' };
  }

  async removeAdmin(actorId: string, userId: string, groupId: string) {
    const groupMembersRepo = this.getGroupMemberRepository();

    const isOwner = await groupMembersRepo.findOne({
      where: {
        group_id: groupId,
        user_id: actorId,
        role: GroupRole.OWNER,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!isOwner) {
      throw new BadRequestException('You are not the owner of the group');
    }

    const userMembership = await groupMembersRepo.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        status: GroupMemberStatus.ACTIVE,
        role: GroupRole.ADMIN,
      },
    });

    if (!userMembership) {
      throw new BadRequestException(
        'User is not an admin of the group',
      );
    }

    userMembership.role = GroupRole.MEMBER;
    await groupMembersRepo.save(userMembership);

    return { message: 'User removed from admin successfully' };
  }

  async findAllJoinRequests(
    userId: string,
    groupId: string,
    limit: number = 10,
    cursor?: string,
  ) {
    const groupMemberRepository = this.getGroupMemberRepository();

    const isAdminOrOwner = await groupMemberRepository.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        role: In([GroupRole.OWNER, GroupRole.ADMIN]),
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!isAdminOrOwner) {
      throw new BadRequestException(
        'User is not an admin or owner of the group',
      );
    }

    const idsQuery = groupMemberRepository
      .createQueryBuilder('group_members')
      .select('group_members.user_id', 'user_id')
      .addSelect('group_members.joined_at', 'joined_at')
      .where('group_members.group_id = :groupId', { groupId })
      .andWhere('group_members.status = :status', {
        status: GroupMemberStatus.PENDING,
      })
      .orderBy('group_members.joined_at', 'DESC')
      .addOrderBy('group_members.user_id', 'DESC')
      .limit(limit + 1);

    if (cursor) {
      const { user_id, joined_at } = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      );

      idsQuery.andWhere(
        '(group_members.joined_at > :joined_at OR (group_members.joined_at = :joined_at AND group_members.user_id > :user_id))',
        { user_id, joined_at },
      );
    }

    const idsResult = await idsQuery.getRawMany();
    let nextCursor: string | null = null;

    if (idsResult.length === 0) {
      return { joinRequests: [], nextCursor };
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

    const joinRequestUserIds = idsResult.map((r) => r.user_id);

    const joinRequests = await groupMemberRepository
      .createQueryBuilder('group_members')
      .innerJoin('group_members.user', 'user')
      .leftJoin('user.profile', 'profile')
      .select([
        'group_members.id',
        'group_members.joined_at',
        'user.id',
        'user.username',
        'user.email',
        'profile.avatar_url',
      ])
      .where('group_members.group_id = :groupId', { groupId })
      .andWhere('group_members.user_id IN (:...joinRequestUserIds)', {
        joinRequestUserIds,
      })
      .orderBy('ARRAY_POSITION(:joinRequestUserIds, group_members.user_id)')
      .getMany();

    return {
      data: joinRequests.map((jr) =>
        plainToInstance(GroupMemberResponseDto, jr, {
          excludeExtraneousValues: true,
        }),
      ),
      nextCursor,
    };
  }

  async approveJoinRequest(actorId: string, groupId: string, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const groupMemberRepo = this.getGroupMemberRepository(manager);

      const isAdminOrOwner = await groupMemberRepo.findOne({
        where: {
          group_id: groupId,
          user_id: actorId,
          role: In([GroupRole.OWNER, GroupRole.ADMIN]),
          status: GroupMemberStatus.ACTIVE,
        },
      });

      if (!isAdminOrOwner) {
        throw new BadRequestException(
          'You are not an admin or owner of the group',
        );
      }

      const membership = await groupMemberRepo.findOne({
        where: {
          group_id: groupId,
          user_id: userId,
          status: GroupMemberStatus.PENDING,
        },
      });

      if (!membership) {
        throw new BadRequestException(
          'Membership not found or already processed',
        );
      }

      membership.status = GroupMemberStatus.ACTIVE;
      await groupMemberRepo.save(membership);

      const groupRepo = this.getGroupRepository(manager);
      await groupRepo.increment({ id: groupId }, 'members_count', 1);

      return { message: 'Member approved successfully' };
    });
  }

  async rejectJoinRequest(actorId: string, groupId: string, userId: string) {
    const groupMemberRepo = this.getGroupMemberRepository();

    const isAdminOrOwner = await groupMemberRepo.findOne({
      where: {
        group_id: groupId,
        user_id: actorId,
        role: In([GroupRole.OWNER, GroupRole.ADMIN]),
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!isAdminOrOwner) {
      throw new BadRequestException(
        'You are not an admin or owner of the group',
      );
    }

    const result = await groupMemberRepo.delete({
      group_id: groupId,
      user_id: userId,
      status: GroupMemberStatus.PENDING,
    });

    if (result.affected && result.affected > 0) {
      return { message: 'Join request rejected successfully' };
    } else {
      throw new BadRequestException('Membership not found or already processed');
    }
  }
}
