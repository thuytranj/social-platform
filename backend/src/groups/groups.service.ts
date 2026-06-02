import { BadRequestException, Injectable } from '@nestjs/common';
import { Group, GroupPrivacy } from './entities/group.entity';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { plainToInstance } from 'class-transformer';
import { GroupResponseDto } from './dto/group-response.dto';
import { CloudinaryService } from '@/integrations/cloudinary.service';
import { Folder } from '@/common/constants/constants';
import { GroupMemberService } from './group-member.service';
import {
  GroupMember,
  GroupMemberStatus,
  GroupRole,
} from './entities/group-member.entity';
import { UpdateGroupDto } from './dto/update-group.dto';
import { User } from '@/users/entities/user.entity';
import { Post } from '@/posts/entities/post.entity';
import { PostResponseDto } from '@/posts/dto/post-response.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
    private readonly groupMemberService: GroupMemberService,
  ) {}

  private getGroupRepository(manager?: any): Repository<Group> {
    return manager?.getRepository(Group) ?? this.groupRepository;
  }

  private getGroupMemberRepository(manager?: any): Repository<GroupMember> {
    return manager?.getRepository(GroupMember) ?? this.groupMemberRepository;
  }

  private getUsersRepository(manager?: any): Repository<User> {
    return manager?.getRepository(User) ?? this.userRepository;
  }

  private getPostRepository(manager?: any): Repository<Post> {
    return manager?.getRepository(Post) ?? this.postRepository;
  }

  private excuteTransaction<T>(
    manager: EntityManager,
    callback: (transactionalEntityManager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return manager
      ? callback(manager)
      : this.groupRepository.manager.transaction(callback);
  }

  async create(
    group: CreateGroupDto,
    creatorId: string,
    coverFile?: Express.Multer.File,
  ) {
    const usersRepo = this.getUsersRepository();
    const existingUser = await usersRepo.findOne({ where: { id: creatorId } });
    if (!existingUser) {
      throw new Error('Creator user not found');
    }

    let cover: any = null;

    try {
      if (coverFile) {
        cover = await this.cloudinaryService.uploadFile(
          coverFile,
          Folder.COVER_PHOTOS,
        );

      }

      return this.dataSource.transaction(async (manager) => {
        const { name, description, privacy } = group;
        const groupRepository = this.getGroupRepository(manager);

        const usersRepo = this.getUsersRepository(manager);
        const existingUser = await usersRepo.findOne({ where: { id: creatorId } });

        if (!existingUser) {
          throw new Error('Creator user not found');
        }

        const newGroup = groupRepository.create({
          name,
          description,
          privacy,
          creator_id: creatorId,
          cover_url: cover?.secure_url,
          cover_public_id: cover?.public_id,
        });
        const savedGroup = await groupRepository.save(newGroup);

        await this.groupMemberService.create(
          creatorId,
          {
            group_id: savedGroup.id,
            role: GroupRole.OWNER,
            status: GroupMemberStatus.ACTIVE,
          },
          manager,
        );

        return this.findOneById(savedGroup.id, manager);
      });
    } catch (error) {
      if (cover?.public_id) {
        await this.cloudinaryService.deleteFile(
          cover.public_id,
          cover.resource_type,
        );
      }

      throw error;
    }
  }

  async findOneById(id: string, manager?: EntityManager, userId?: string) {
    const groupRepository = this.getGroupRepository(manager);

    const group = await groupRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    let groupMember: GroupMember | null = null;
    if (userId) {
      const groupMemberRepository = this.getGroupMemberRepository(manager);
      groupMember = await groupMemberRepository.findOne({
        where: { group_id: id, user_id: userId },
      });
    }

    return {
      ... plainToInstance(GroupResponseDto, group, {
        excludeExtraneousValues: true,
      }),
      role: groupMember?.role || null,
      status: groupMember?.status || null,
    }
  }

  async findAllGroupsByUserId(
    userId: string,
    limit: number = 10,
    cursor?: string,
    manager?: EntityManager,
  ) {
    const groupMemberRepository = this.getGroupMemberRepository(manager);
    const groupRepository = this.getGroupRepository(manager);

    const idsQuery = groupMemberRepository
      .createQueryBuilder('group_members')
      .select('group_members.group_id', 'group_id')
      .addSelect('group_members.joined_at', 'joined_at')
      .addSelect('group_members.role', 'role')
      .where('group_members.user_id = :userId', { userId })
      .andWhere('group_members.status = :status', {
        status: GroupMemberStatus.ACTIVE,
      })
      .orderBy('group_members.joined_at', 'DESC')
      .addOrderBy('group_members.group_id', 'DESC')
      .limit(limit + 1);
    
    if (cursor) {
      const { joined_at, group_id } = JSON.parse(Buffer.from(cursor, 'base64').toString('ascii'));
      
      idsQuery.andWhere(
        '(group_members.joined_at < :joined_at OR (group_members.joined_at = :joined_at AND group_members.group_id < :group_id))',
        {
          joined_at: new Date(joined_at),
          group_id: group_id,
        },
      );
    }

    const idsResult = await idsQuery.getRawMany();
    let nextCursor: string | null = null;

    if (idsResult.length === 0) {
      return { groups: [], nextCursor };
    }

    if (idsResult.length > limit) {
      idsResult.pop();
      const cursorTarget = idsResult[idsResult.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          joined_at: cursorTarget.joined_at,
          group_id: cursorTarget.group_id,
        }),
      ).toString('base64');
    }

    const groupIds = idsResult.map((item) => item.group_id);
    const hm = new Map<string, GroupRole>();
    idsResult.forEach((item) => {
      hm.set(item.group_id, item.role);
    })

    const groups = await groupRepository.createQueryBuilder('groups')
      .leftJoinAndSelect('groups.creator', 'creator')
      .where('groups.id IN (:...groupIds)', { groupIds })
      .orderBy(`array_position(ARRAY[:...groupIds]::uuid[], groups.id)`) 
      .getMany();

    return {
      groups: groups.map(group => {
        return {
          ...plainToInstance(GroupResponseDto, group, {
            excludeExtraneousValues: true,
          }),
          role: hm.get(group.id),
        };
      }),
      nextCursor,
    };
  }

  async update(
    userId: string,
    groupId: string,
    updateGroupDto: UpdateGroupDto,
    manager?: EntityManager,
  ) {
    const groupRepo = this.getGroupRepository(manager);
    const { privacy } = updateGroupDto;

    const group = await groupRepo.findOne({ where: { id: groupId } });
    if (!group) {
      throw new BadRequestException('Group not found');
    }

    if (privacy !== undefined) {
      if (group.creator_id !== userId) {
        throw new BadRequestException(
          'Only group creator can update the privacy settings of the group',
        );
      }
    } else {
      const groupMemberRepo = this.getGroupMemberRepository(manager);
      const idAdminOrOwner = await groupMemberRepo.findOne({
        where: {
          group_id: groupId,
          user_id: userId,
          role: In([GroupRole.OWNER, GroupRole.ADMIN]),
          status: GroupMemberStatus.ACTIVE,
        },
      });

      if (!idAdminOrOwner) {
        throw new BadRequestException(
          'Only group creator or admin can update the group',
        );
      }
    }

    const updatedGroup = Object.assign(group, updateGroupDto);
    await groupRepo.save(updatedGroup);

    return this.findOneById(groupId, manager);
  }

  async remove(userId: string, groupId: string, manager?: EntityManager) {
    const groupRepo = this.getGroupRepository(manager);
    const isOwner = await groupRepo.findOne({
      where: {
        id: groupId,
        creator_id: userId,
      },
    });

    if (!isOwner) {
      throw new BadRequestException('Only group creator can delete the group');
    }

    const res = await groupRepo.delete({ id: groupId });

    if (res.affected && res.affected > 0) {
      return { message: 'Group deleted successfully' };
    } else {
      throw new BadRequestException('Failed to delete group');
    }
  }

  async findPostsByGroupId(
    actorId: string,
    groupId: string,
    limit: number = 10,
    cursor?: string,
    manager?: EntityManager,
  ) {
    const groupMemberRepository = this.getGroupMemberRepository(manager);
    const postRepository = this.getPostRepository(manager);

    const groupRepository = this.getGroupRepository(manager);
    const group = await groupRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new BadRequestException('Group not found');
    }

    if (group.privacy === GroupPrivacy.PRIVATE) {
      const isMember = await groupMemberRepository.findOne({
        where: {
          group_id: groupId,
          user_id: actorId,
          status: GroupMemberStatus.ACTIVE,
        },
      });

      if (!isMember) {
        throw new BadRequestException('You are not a member of this private group');
      }
    }

    const query = postRepository.createQueryBuilder('post').leftJoinAndSelect('post.postMedias', 'pm').leftJoinAndSelect('pm.media', 'media').leftJoinAndSelect('post.author', 'author').where('post.group_id = :groupId', { groupId }).orderBy('post.created_at', 'DESC').addOrderBy('post.id', 'DESC').limit(limit + 1);

    if (cursor) {
      const { created_at, id } = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
      query.andWhere('post.created_at < :created_at OR (post.created_at = :created_at AND post.id < :id)', { created_at: new Date(created_at), id });
    }

    const posts = await query.getMany();
    let nextCursor: string | null = null;

    if (!posts.length) {
      return {
        data: [],
        nextCursor: null,
      };
    }

    
    if (posts.length > limit) {
      const lastPost = posts.pop();
      nextCursor = Buffer.from(JSON.stringify({ created_at: new Date(posts[limit-1].created_at).toISOString(), id: posts[limit-1].id })).toString('base64');
    }

    return {
      data: posts.map((post) =>
        plainToInstance(PostResponseDto, post, {
          excludeExtraneousValues: true,
        }),
      ),
      nextCursor,
    };
  }
}
