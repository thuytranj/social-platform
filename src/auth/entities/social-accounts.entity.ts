import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from "typeorm";
import { User } from "../../users/entities/user.entity";

export enum SocialProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  GITHUB = 'github',
}

@Entity('social_accounts')
  @Unique(['provider', 'provider_user_id'])
  @Index(['provider', 'provider_user_id'])
export class SocialAccountDto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;
  
  @Column({type: 'enum', enum: SocialProvider})
  provider: SocialProvider;

  @Column()
  provider_user_id: string;

  @ManyToOne(() => User, (user) => user.socialAccounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}