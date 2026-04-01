import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}
  
  async create(createUserDto: CreateUserDto) {
    const newUser = await this.userRepository.create(createUserDto);

    return await this.userRepository.save(newUser);
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
    return this.userRepository.findOne({ where: { email } });
  }

  findOneByUsernameRaw(username: string) {
    return this.userRepository.findOne({ where: { username } });
  }

  findOneByIdRaw(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }
  

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
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
