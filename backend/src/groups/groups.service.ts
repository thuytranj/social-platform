import { Injectable } from '@nestjs/common';
import { Group } from './entities/group.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UsersService } from '@/users/users.service';
import { plainToInstance } from 'class-transformer';
import { GroupResponseDto } from './dto/group-response.dto';
import { CloudinaryService } from '@/integrations/cloudinary.service';
import { Folder } from '@/common/constants/constants';
import { GroupMemberService } from './group-member.service';
import { GroupMemberStatus, GroupRole } from './entities/group-member.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
    private readonly groupMemberService: GroupMemberService,
  ) {}

  private getGroupRepository(manager?: any): Repository<Group> {
    return manager?.getRepository(Group) ?? this.groupRepository;
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
    const existingUser = await this.userService.findOneByIdRaw(creatorId);
    if (!existingUser) {
      throw new Error('Creator user not found');
    }

    let conver: any = null;

    try {
      if (coverFile) {
        conver = await this.cloudinaryService.uploadFile(
          coverFile,
          Folder.COVER_PHOTOS,
        );
      }

      return this.dataSource.transaction(async (manager) => {
        const { name, description, privacy } = group;
        const groupRepository = this.getGroupRepository(manager);

        const existingUser = await this.userService.findOneByIdRaw(
          creatorId,
          manager,
        );

        if (!existingUser) {
          throw new Error('Creator user not found');
        }

        const newGroup = groupRepository.create({
          name,
          description,
          privacy,
          creator_id: creatorId,
          cover_url: conver?.secure_url,
          cover_public_id: conver?.public_id,
        });
        console.log('newGroup', newGroup);
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
      if (conver?.public_id) {
        await this.cloudinaryService.deleteFile(conver.public_id, conver.resource_type);
      }
    }
  }

  async findOneById(id: string, manager?: EntityManager) {
    const groupRepository = this.getGroupRepository(manager);

    const group = await groupRepository.findOne({
      where: { id },
      relations: ['creator'],
    });
    return plainToInstance(GroupResponseDto, group, {
      excludeExtraneousValues: true,
    });
  }
}
