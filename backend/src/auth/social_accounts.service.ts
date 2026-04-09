import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SocialAccount } from './entities/social-accounts.entity';
import { SocialAccountDto } from './dto/social_account.dto';

@Injectable()
export class SocialAccountsService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
  ) { }
  
  create(socialAccountDto: SocialAccountDto) {
    return this.socialAccountRepository.save({
      ...socialAccountDto,
      user: { id: socialAccountDto.user_id },
    });   
  }
}