import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';
import { ProfileDto } from './dto/profile-dto';
import { Profile } from './entities/profile.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { SocialAccount } from '../auth/entities/social-accounts.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>, @InjectRepository(Profile) private readonly profileRepository: Repository<Profile>) {}
  
  async create(createUserDto: CreateUserDto, profileDto?: ProfileDto) {
    const newUser = await this.userRepository.create(createUserDto);

    const savedUser = await this.userRepository.save(newUser);

    if (profileDto) {
      await this.updateProfile(savedUser.id, profileDto);
    }

    return savedUser;
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  findOneByEmailRaw(email: string) {
    return this.userRepository.findOne({ where: { email }, relations: ['socialAccounts', 'profile'] });
  }

  findOneByUsernameRaw(username: string) {
    return this.userRepository.findOne({ where: { username }, relations: ['profile'] });
  }

  findOneByIdRaw(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  updateUser(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  updateProfile(userId: string, profileDto: ProfileDto) {
    return this.profileRepository.save({
      ...profileDto,
      user: { id: userId },
    });
  }

  verifyEmail(email: string) {
    return this.userRepository.update({ email }, { is_verified: true });
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.userRepository.remove(user);
  }
}
