import { BadRequestException, Injectable } from '@nestjs/common';
import { Friendship } from './entities/friendship.entity';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateFriendshipDto } from './dto/creat-friendship.dto';
import { FriendshipStatus } from './entities/friendship.entity';
import { UsersService } from '@/users/users.service';
import { ConfirmFriendshipDto } from './dto/confirm-friendship-dto';
import { plainToInstance } from 'class-transformer';
import { FriendshipResponseDto } from './dto/friendship-response.dto';
import { UserResponseDto } from '@/users/dto/user-response.dto';
import { User } from '@/users/entities/user.entity';

@Injectable()
export class FriendshipsService {
  constructor(
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    private usersService: UsersService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private getFriendshipRepository(manager?: EntityManager) {
    return manager?.getRepository(Friendship) ?? this.friendshipRepository;
  }

  private getUserRepository(manager?: EntityManager) {
    return manager?.getRepository(User) ?? this.userRepository;
  }

  async create(
    requester_id: string,
    createFriendshipDto: CreateFriendshipDto,
    manager?: EntityManager,
  ) {
    const { addressee_id } = createFriendshipDto;
    const friendshipRepository = this.getFriendshipRepository(manager);
    const user_low_id =
      requester_id < addressee_id ? requester_id : addressee_id;
    const user_high_id =
      requester_id > addressee_id ? requester_id : addressee_id;

    const existingFriendship = await friendshipRepository.findOne({
      where: [{ user_high_id, user_low_id }],
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'blocked') {
        throw new BadRequestException(
          'You cannot send a friend request to this user because you have blocked them or they have blocked you.',
        );
      } else if (existingFriendship.status === 'accepted') {
        throw new BadRequestException(
          'You are already friends with this user.',
        );
      } else if (existingFriendship.status === 'pending') {
        if (existingFriendship.addressee_id === requester_id) {
          await this.confirmRequest(
            existingFriendship.addressee_id,
            {
              requester_id: existingFriendship.requester_id,
              status: FriendshipStatus.ACCEPTED,
            },
            manager,
          );
          const updatedFriendship = await friendshipRepository.findOne({
            where: { id: existingFriendship.id },
          });

          return plainToInstance(FriendshipResponseDto, updatedFriendship, {
            excludeExtraneousValues: true,
          });
        } else {
          throw new BadRequestException(
            'You have already sent a friend request to this user. Please wait for them to accept it.',
          );
        }
      } else if (existingFriendship.status === 'rejected') {
        throw new BadRequestException(
          'Your previous friend request to this user was rejected. Please wait before sending another request.',
        );
      }
    } else {
      const addressee = await this.usersService.findOneByIdRaw(
        addressee_id,
        manager,
      );

      if (!addressee) {
        throw new BadRequestException('Addressee user not found');
      }

      const friendship = friendshipRepository.create({
        requester_id,
        addressee_id,
        user_low_id,
        user_high_id,
        status: FriendshipStatus.PENDING,
        requester: { id: requester_id },
        addressee: { id: addressee_id },
      });

      const savedFriendship = await friendshipRepository.save(friendship);

      return plainToInstance(FriendshipResponseDto, savedFriendship, {
        excludeExtraneousValues: true,
      });
    }
  }

  findOne(id: string, manager?: EntityManager) {
    const friendshipRepository = this.getFriendshipRepository(manager);
    return friendshipRepository.findOne({ where: { id } });
  }

  async getSentRequests(
    userId: string,
    limit: number = 10,
    cursor?: string,
    manager?: EntityManager,
  ) {
    const friendshipRepository = this.getFriendshipRepository(manager);
    const idsQuery = friendshipRepository
      .createQueryBuilder('friendship')
      .select('friendship.id', 'id')
      .addSelect('friendship.created_at', 'created_at')
      .where('friendship.requester_id = :userId', { userId })
      .andWhere('friendship.status = :status', {
        status: FriendshipStatus.PENDING,
      })
      .orderBy('friendship.created_at', 'DESC')
      .addOrderBy('friendship.id', 'DESC')
      .limit(limit + 1);

    if (cursor) {
      const { created_at, id } = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      );
      idsQuery.andWhere(
        '(friendship.created_at < :created_at OR (friendship.created_at = :created_at AND friendship.id < :id))',
        {
          created_at: new Date(created_at),
          id,
        },
      );
    }

    const idsResult = await idsQuery.getRawMany();
    let nextCursor: string | null = null;

    if (idsResult.length === 0) {
      return {
        data: [],
        nextCursor: null,
      }
    }

    if (idsResult.length > limit) {
      idsResult.pop();
      const cursorTarget = idsResult[limit - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          created_at: cursorTarget.created_at.toISOString(),
          id: cursorTarget.id,
        }),
      ).toString('base64');
    }

    const friendshipIds = idsResult.map((r) => r.id);

    const sentRequests = await friendshipRepository
      .createQueryBuilder('friendship')
      .leftJoin('friendship.addressee', 'addressee')
      .leftJoin('addressee.profile', 'addresseeProfile')
      .select([
        'friendship',
        'addressee.id',
        'addressee.username',
        'addresseeProfile.avatar_url',
      ])
      .where('friendship.id IN (:...ids)', { ids: friendshipIds })
      .orderBy('ARRAY_POSITION(:ids::uuid[], friendship.id)')
      .setParameter('ids', friendshipIds)
      .getMany();

    return {
      data: sentRequests.map((request) =>
        plainToInstance(FriendshipResponseDto, request, {
          excludeExtraneousValues: true,
        }),
      ),
      nextCursor,
    };
  }

  async cancelRequest(
    userId: string,
    addresseeId: string,
    manager?: EntityManager,
  ) {
    const friendshipRepository = this.getFriendshipRepository(manager);
    const result = await friendshipRepository.delete({
      requester_id: userId,
      addressee_id: addresseeId,
      status: FriendshipStatus.PENDING,
    });

    if (!result.affected) {
      throw new BadRequestException(
        'No pending friend request found for this addressee.',
      );
    }

    return { message: 'Friend request canceled successfully.' };
  }

  async confirmRequest(
    userId: string,
    confirmFriendshipDto: ConfirmFriendshipDto,
    manager?: EntityManager,
  ) {
    const friendshipRepository = this.getFriendshipRepository(manager);
    await friendshipRepository.update(
      { requester_id: confirmFriendshipDto.requester_id, addressee_id: userId },
      { status: confirmFriendshipDto.status as FriendshipStatus },
    );

    return {
      message: `Friend request ${confirmFriendshipDto.status.toLowerCase()} successfully.`,
    };
  }

  async getReceivedRequests(
    userId: string,
    limit: number = 10,
    cursor?: string,
    manager?: EntityManager,
  ) {
    const friendshipRepository = this.getFriendshipRepository(manager);
    const idsQuery = friendshipRepository
      .createQueryBuilder('friendship')
      .select('friendship.id', 'id')
      .addSelect('friendship.created_at', 'created_at')
      .where('friendship.addressee_id = :userId', { userId })
      .andWhere('friendship.status = :status', {
        status: FriendshipStatus.PENDING,
      })
      .orderBy('friendship.created_at', 'DESC')
      .addOrderBy('friendship.id', 'DESC')
      .limit(limit + 1);

    if (cursor) {
      const { created_at, id } = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      );
      idsQuery.andWhere(
        '(friendship.created_at < :created_at OR (friendship.created_at = :created_at AND friendship.id < :id))',
        {
          created_at: new Date(created_at),
          id,
        },
      );
    }

    const idsResult = await idsQuery.getRawMany();
    let nextCursor: string | null = null;

    if (idsResult.length === 0) {
      return {
        data: [],
        nextCursor: null,
      }
    }

    if (idsResult.length > limit) {
      idsResult.pop();
      const cursorTarget = idsResult[limit - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          created_at: cursorTarget.created_at.toISOString(),
          id: cursorTarget.id,
        }),
      ).toString('base64');
    }

    const friendshipIds = idsResult.map((r) => r.id);
    const receivedRequests = await friendshipRepository
      .createQueryBuilder('friendship')
      .leftJoin('friendship.requester', 'requester')
      .leftJoin('requester.profile', 'requesterProfile')
      .select([
        'friendship',
        'requester.id',
        'requester.username',
        'requesterProfile.avatar_url',
      ])
      .where('friendship.id IN (:...ids)', { ids: friendshipIds })
      .orderBy('ARRAY_POSITION(:ids::uuid[], friendship.id)')
      .setParameter('ids', friendshipIds)
      .getMany();
    
    return {
      data: receivedRequests.map((request) =>
        plainToInstance(FriendshipResponseDto, request, {
          excludeExtraneousValues: true,
        }),
      ),
      nextCursor,
    };
  }

  async getFriends(
    userId: string,
    limit: number = 10,
    cursor?: string,
    manager?: EntityManager,
  ) {
    const friendshipRepository = this.getFriendshipRepository(manager);
    const query = friendshipRepository
      .createQueryBuilder('friendship')
      .leftJoin('friendship.requester', 'requester')
      .leftJoin('friendship.addressee', 'addressee')
      .leftJoin('requester.profile', 'requesterProfile')
      .leftJoin('addressee.profile', 'addresseeProfile')
      .addSelect([
        'requester.id',
        'requester.username',
        'requesterProfile.avatar_url',
        'addressee.id',
        'addressee.username',
        'addresseeProfile.avatar_url',
      ])
      .where(
        '((friendship.requester_id = :userId AND friendship.status = :status) OR (friendship.addressee_id = :userId AND friendship.status = :status))',
        {
          userId,
          status: FriendshipStatus.ACCEPTED,
        },
      )
      .orderBy('friendship.created_at', 'DESC')
      .addOrderBy('friendship.id', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const { created_at, id } = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      );
      query.andWhere(
        '(friendship.created_at < :created_at OR (friendship.created_at = :created_at AND friendship.id < :id))',
        {
          created_at: new Date(created_at),
          id,
        },
      );
    }

    const friends = await query.getMany();
    let nextCursor: string | null = null;

    if (friends.length > limit) {
      friends.pop();
      const cursorTarget = friends[limit - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          created_at: cursorTarget.created_at.toISOString(),
          id: cursorTarget.id,
        }),
      ).toString('base64');
    }

    return {
      data: friends.map((friendship) => {
        if (friendship.requester_id === userId) {
          return plainToInstance(UserResponseDto, friendship.addressee, {
            excludeExtraneousValues: true,
          });
        } else {
          return plainToInstance(UserResponseDto, friendship.requester, {
            excludeExtraneousValues: true,
          });
        }
      }),
      nextCursor,
    };
  }

  async blockUser(
    userId: string,
    blockedUserId: string,
    manager?: EntityManager,
  ) {
    if (userId === blockedUserId) {
      throw new BadRequestException('You cannot block yourself.');
    }
    const friendshipRepository = this.getFriendshipRepository(manager);
    const user_low_id = userId < blockedUserId ? userId : blockedUserId;
    const user_high_id = userId > blockedUserId ? userId : blockedUserId;

    const existingFriendship = await friendshipRepository.findOne({
      where: [{ user_high_id, user_low_id }],
    });

    if (!existingFriendship) {
      const friendship = friendshipRepository.create({
        requester_id: userId,
        addressee_id: blockedUserId,
        user_low_id,
        user_high_id,
        status: FriendshipStatus.BLOCKED,
        requester: { id: userId },
        addressee: { id: blockedUserId },
      });

      return friendshipRepository.save(friendship);
    }

    if (existingFriendship.status === FriendshipStatus.BLOCKED) {
      throw new BadRequestException('This user is already blocked.');
    }

    return friendshipRepository.update(
      { user_high_id, user_low_id },
      {
        requester_id: userId,
        addressee_id: blockedUserId,
        status: FriendshipStatus.BLOCKED,
      },
    );
  }

  async unblockUser(
    userId: string,
    unblockedUserId: string,
    manager?: EntityManager,
  ) {
    if (userId === unblockedUserId) {
      throw new BadRequestException('You cannot unblock yourself.');
    }

    const friendshipRepository = this.getFriendshipRepository(manager);
    const user_low_id = userId < unblockedUserId ? userId : unblockedUserId;
    const user_high_id = userId > unblockedUserId ? userId : unblockedUserId;

    const existingFriendship = await friendshipRepository.findOne({
      where: [{ user_high_id, user_low_id, status: FriendshipStatus.BLOCKED }],
    });

    if (!existingFriendship) {
      throw new BadRequestException('You have not blocked this user.');
    }

    if (existingFriendship.requester_id !== userId) {
      throw new BadRequestException(
        'You cannot unblock this user because you are not the one who blocked this relation.',
      );
    }

    return friendshipRepository.delete({ user_high_id, user_low_id });
  }

  async getBlockedUsers(
    userId: string,
    limit: number = 10,
    cursor?: string,
    manager?: EntityManager,
  ) {
    const friendshipRepository = this.getFriendshipRepository(manager);
    const query = friendshipRepository
      .createQueryBuilder('friendship')
      .leftJoin('friendship.addressee', 'addressee')
      .leftJoin('addressee.profile', 'addresseeProfile')
      .addSelect(['addressee.id', 'addressee.username', 'addresseeProfile.avatar_url'])
      .where('friendship.requester_id = :userId', { userId })
      .andWhere('friendship.status = :status', {
        status: FriendshipStatus.BLOCKED,
      })
      .orderBy('friendship.created_at', 'DESC')
      .addOrderBy('friendship.id', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const { created_at, id } = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      );
      query.andWhere(
        '(friendship.created_at < :created_at OR (friendship.created_at = :created_at AND friendship.id < :id))',
        {
          created_at: new Date(created_at),
          id,
        },
      );
    }

    const blockedFriendships = await query.getMany();
    let nextCursor: string | null = null;

    if (blockedFriendships.length > limit) {
      blockedFriendships.pop();
      const cursorTarget = blockedFriendships[limit - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          created_at: cursorTarget.created_at.toISOString(),
          id: cursorTarget.id,
        }),
      ).toString('base64');
    }

    return {
      data: blockedFriendships.map((friendship) => {
        return plainToInstance(UserResponseDto, friendship.addressee, {
          excludeExtraneousValues: true,
        });
      }),
      nextCursor,
    };
  }

  async getMutualFriends(
    userId: string,
    otherUserId: string,
    limit: number = 10,
    cursor?: string,
    manager?: EntityManager,
  ) {
    const friendshipRepository = this.getFriendshipRepository(manager);
    const userRepository = this.getUserRepository(manager);
    const listFriendsOfUser = await friendshipRepository
      .createQueryBuilder('friendship')
      .select(
        'CASE WHEN friendship.requester_id = :userId THEN friendship.addressee_id ELSE friendship.requester_id END',
        'friendId',
      )
      .where(
        '(friendship.requester_id = :userId OR friendship.addressee_id = :userId) AND friendship.status = :status',
        { userId, status: FriendshipStatus.ACCEPTED },
      )
      .getRawMany();

    const friendIds = listFriendsOfUser.map((f) => f.friendId);

    if (!friendIds.length) {
      return {
        data: [],
        nextCursor: null,
      };
    }

    const mutualFriendIdsQuery = friendshipRepository
      .createQueryBuilder('friendship')
      .select(
        'CASE WHEN friendship.requester_id = :otherUserId THEN friendship.addressee_id ELSE friendship.requester_id END',
        'friendId',
      )
      .where(
        '(friendship.requester_id = :otherUserId OR friendship.addressee_id = :otherUserId) AND friendship.status = :status',
        { otherUserId, status: FriendshipStatus.ACCEPTED },
      )
      .andWhere(
        'CASE WHEN friendship.requester_id = :otherUserId THEN friendship.addressee_id ELSE friendship.requester_id END IN (:...friendIds)',
        { friendIds },
      );

    const usersQuery = userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where(`user.id IN (${mutualFriendIdsQuery.getQuery()})`)
      .setParameters(mutualFriendIdsQuery.getParameters())
      .orderBy('user.id', 'ASC')
      .take(limit + 1);

    if (cursor) {
      const { id } = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      );
      usersQuery.andWhere('user.id > :cursorId', { cursorId: id });
    }

    const mutualFriends = await usersQuery.getMany();
    let nextCursor: string | null = null;

    if (mutualFriends.length > limit) {
      mutualFriends.pop();
      const cursorTarget = mutualFriends[limit - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ id: cursorTarget.id }),
      ).toString('base64');
    }

    return {
      data: mutualFriends.map((friend) => {
        return plainToInstance(UserResponseDto, friend, {
          excludeExtraneousValues: true,
        });
      }),
      nextCursor,
    };
  }

  async removeFriend(actorId: string, userId: string, manager?: EntityManager) {
    const friendshipRepository = this.getFriendshipRepository(manager);

    const user_low_id = actorId < userId ? actorId : userId;
    const user_high_id = actorId > userId ? actorId : userId;

    const existingFriendship = await friendshipRepository.findOne({
      where: [{ user_high_id, user_low_id, status: FriendshipStatus.ACCEPTED }],
    });

    if (!existingFriendship) {
      throw new BadRequestException('You are not friends with this user.');
    }

    friendshipRepository.delete({ user_high_id, user_low_id });
    return { message: 'Unfriended successfully.' };
  }
}
