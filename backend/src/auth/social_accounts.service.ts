import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SocialAccount } from './entities/social-accounts.entity';
import { SocialAccountDto } from './dto/social_account.dto';

@Injectable()
export class SocialAccountsService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
  ) {}

  private getSocialAccountRepository(manager?: EntityManager) {
    return (
      manager?.getRepository(SocialAccount) ?? this.socialAccountRepository
    );
  }

  create(socialAccountDto: SocialAccountDto, manager?: EntityManager) {
    const socialAccountRepository = this.getSocialAccountRepository(manager);

    return socialAccountRepository.save({
      ...socialAccountDto,
      user: { id: socialAccountDto.user_id },
    });
  }
}
