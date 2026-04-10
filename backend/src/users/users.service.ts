import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { EntityManager, ILike, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';
import { ProfileDto } from './dto/profile.dto';
import { Profile } from './entities/profile.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { DataSource } from 'typeorm';
import { CloudinaryService } from '@/integrations/cloudinary.service';
import { Folder } from '@/common/constants/constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private getUserRepository(manager?: EntityManager) {
    return manager?.getRepository(User) ?? this.userRepository;
  }

  private getProfileRepository(manager?: EntityManager) {
    return manager?.getRepository(Profile) ?? this.profileRepository;
  }

  private executeTransaction<T>(
    manager: EntityManager | undefined,
    callback: (transactionManager: EntityManager) => Promise<T>,
  ) {
    return manager ? callback(manager) : this.dataSource.transaction(callback);
  }

  async create(
    createUserDto: CreateUserDto,
    profileDto?: ProfileDto,
    manager?: EntityManager,
  ) {
    return this.executeTransaction(manager, async (transactionManager) => {
      const userRepo = this.getUserRepository(transactionManager);
      const profileRepo = this.getProfileRepository(transactionManager);

      const user = userRepo.create(createUserDto);

      if (profileDto) {
        const profile = profileRepo.create([profileDto as any])[0];
        user.profile = profile;
      }
      else {
        user.profile = profileRepo.create();
      }

      const savedUser = await userRepo.save(user);

      return plainToInstance(UserResponseDto, savedUser, {
        excludeExtraneousValues: true,
      });
    });
  }

  async findAll(manager?: EntityManager) {
    const userRepo = this.getUserRepository(manager);
    const users = await userRepo.find();
    return users.map((user) =>
      plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findOneByUsername(
    userId: string,
    username: string,
    manager?: EntityManager,
  ) {
    const userRepo = this.getUserRepository(manager);
    const user = await userRepo.findOne({
      where: { username: ILike(`%${username}%`), id: Not(userId) },
      relations: ['profile'],
    });
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async findOne(id: string, manager?: EntityManager) {
    const userRepo = this.getUserRepository(manager);
    const user = await userRepo.findOne({
      where: { id },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  findOneByEmailRaw(email: string, manager?: EntityManager) {
    const userRepo = this.getUserRepository(manager);
    return userRepo.findOne({
      where: { email },
      relations: ['socialAccounts', 'profile'],
    });
  }

  findOneByUsernameRaw(username: string, manager?: EntityManager) {
    const userRepo = this.getUserRepository(manager);
    return userRepo.findOne({
      where: { username },
      relations: ['profile'],
    });
  }

  findOneByIdRaw(id: string, manager?: EntityManager) {
    const userRepo = this.getUserRepository(manager);
    return userRepo.findOne({ where: { id } });
  }

  updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    manager?: EntityManager,
  ) {
    const userRepo = this.getUserRepository(manager);
    return userRepo.update(id, updateUserDto);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
    coverFile?: Express.Multer.File,
    manager?: EntityManager,
  ) {
    let avatar: any = null,
      cover: any = null;

    try {
      if (avatarFile) {
        avatar = await this.cloudinaryService.uploadFile(
          avatarFile,
          Folder.AVATARS,
        );
      }

      if (coverFile) {
        cover = await this.cloudinaryService.uploadFile(
          coverFile,
          Folder.COVER_PHOTOS,
        );
      }

      const result = await this.executeTransaction(
        manager,
        async (transactionManager) => {
          const profileRepo = this.getProfileRepository(transactionManager);

          const profile = await profileRepo.findOne({
            where: { user: { id: userId } },
          });

          if (!profile) {
            throw new NotFoundException(
              `Profile for user with id ${userId} not found`,
            );
          }

          const oldAvatarPublicId = profile.avatar_public_id;
          const oldCoverPublicId = profile.cover_public_id;

          Object.assign(profile, {
            ...updateProfileDto,
            avatar_url: avatar ? avatar.secure_url : profile.avatar_url,
            avatar_public_id: avatar
              ? avatar.public_id
              : profile.avatar_public_id,
            cover_url: cover ? cover.secure_url : profile.cover_url,
            cover_public_id: cover ? cover.public_id : profile.cover_public_id,
          });

          await profileRepo.save(profile);

          return {
            oldAvatarPublicId,
            oldCoverPublicId,
            profile,
          };
        },
      );

      if (avatar && result.oldAvatarPublicId) {
        await this.cloudinaryService.deleteFile(
          result.oldAvatarPublicId,
          'image',
        );
      }

      if (cover && result.oldCoverPublicId) {
        await this.cloudinaryService.deleteFile(
          result.oldCoverPublicId,
          'image',
        );
      }

      return plainToInstance(ProfileResponseDto, result.profile, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (avatar?.public_id) {
        await this.cloudinaryService.deleteFile(
          avatar.public_id,
          avatar.resource_type,
        );
      }
      if (cover?.public_id) {
        await this.cloudinaryService.deleteFile(
          cover.public_id,
          cover.resource_type,
        );
      }
      throw error;
    }
  }

  verifyEmail(email: string, manager?: EntityManager) {
    const userRepo = this.getUserRepository(manager);
    return userRepo.update({ email }, { is_verified: true });
  }

  async remove(id: string, manager?: EntityManager) {
    const userRepo = this.getUserRepository(manager);
    const user = await userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return userRepo.remove(user);
  }
}
