import { BeforeInsert, Column, Entity,PrimaryColumn, Index, OneToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Profile } from './profile.entity';
import { v7 as uuidv7 } from 'uuid';
import { VerificationCode } from '../../auth/entities/verification-codes.entity';
import { SocialAccountDto } from '../../auth/entities/social-accounts.entity';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  email: string;

  @Index()
  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ nullable: true, select: false })
  refresh_token: string;

  @Column({ nullable: true })
  profile_id: string;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  last_active_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => Profile, (profile) => profile.user)
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @OneToMany(() => VerificationCode, (verificationCode) => verificationCode.user)
  verificationCodes: VerificationCode[];

  @OneToMany(() => SocialAccountDto, (socialAccount) => socialAccount.user)
  socialAccounts: SocialAccountDto[];
  
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
