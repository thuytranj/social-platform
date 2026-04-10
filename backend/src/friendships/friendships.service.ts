import { BadRequestException, Injectable } from '@nestjs/common';
import { Friendship } from './entities/friendship.entity';
import { EntityManager, In, Repository } from 'typeorm';
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

  async getSentRequests(userId: string, page: number = 1, limit: number = 10, manager?: EntityManager) {
    const skip = (page - 1) * limit;

    const friendshipRepository = this.getFriendshipRepository(manager);
    const [sentRequests, total] = await friendshipRepository.findAndCount({
      where: { requester_id: userId, status: FriendshipStatus.PENDING },
      relations: ['addressee'],
      skip,
      take: limit,
    });

    return {
      data: sentRequests.map((request) =>
        plainToInstance(FriendshipResponseDto, request, {
          excludeExtraneousValues: true,
        }),
      ),
      page: page,
      limit: limit,
      total,
      totalPages: Math.ceil(total / limit),
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
    }
  }

  async getReceivedRequests(userId: string, page: number = 1, limit: number = 10, manager?: EntityManager) {
    const friendshipRepository = this.getFriendshipRepository(manager);
    const skip = (page - 1) * limit;
    const [receivedRequests, total] = await friendshipRepository.findAndCount({
      where: { addressee_id: userId, status: FriendshipStatus.PENDING },
      relations: ['requester'],
      skip,
      take: limit,
    });

    return {
      data: receivedRequests.map((request) =>
        plainToInstance(FriendshipResponseDto, request, {
          excludeExtraneousValues: true,
        }),
      ),
      page: page,
      limit: limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFriends(userId: string, page: number = 1, limit: number = 10, manager?: EntityManager) {
    const friendshipRepository = this.getFriendshipRepository(manager);
    const skip = (page - 1) * limit;
    const [friends, total] = await friendshipRepository.findAndCount({
      where: [
        { requester_id: userId, status: FriendshipStatus.ACCEPTED },
        { addressee_id: userId, status: FriendshipStatus.ACCEPTED },
      ],
      relations: [
        'requester',
        'addressee',
        'requester.profile',
        'addressee.profile',
      ],
      skip,
      take: limit,
    });

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
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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

  async getBlockedUsers(userId: string, page: number = 1, limit: number = 10, manager?: EntityManager) {
    const friendshipRepository = this.getFriendshipRepository(manager);
    const [blockedFriendships, total] = await friendshipRepository.findAndCount({
      where: [{ requester_id: userId, status: FriendshipStatus.BLOCKED }],
      relations: ['addressee', 'addressee.profile'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: blockedFriendships.map((friendship) => {
        return plainToInstance(UserResponseDto, friendship.addressee, {
          excludeExtraneousValues: true,
        });
      }),
      page: page,
      limit: limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMutualFriends(
    userId: string,
    otherUserId: string,
    page: number = 1,
    limit: number = 10,
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

    const query = await friendshipRepository
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
        { friendIds: listFriendsOfUser.map((f) => f.friendId) },
      )

    const mutualFriendIds = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany();

    const total = await query.getCount();

    const mutualFriends = await userRepository.find({
      where: { id: In(mutualFriendIds.map((f) => f.friendId)) },
      relations: ['profile'],
    });

    return {
      data: mutualFriends.map((friend) => {
        return plainToInstance(UserResponseDto, friend, {
          excludeExtraneousValues: true,
        });
      }),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
