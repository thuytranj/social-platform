import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryColumn,
  Index,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Profile } from './profile.entity';
import { v7 as uuidv7 } from 'uuid';
import { SocialAccount } from '../../auth/entities/social-accounts.entity';
import { Friendship } from '../../friendships/entities/friendship.entity';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ unique: true })
  email!: string;

  @Index()
  @Column({ unique: true, nullable: true })
  username!: string;

  @Column({ nullable: true })
  password!: string;

  @Column({ default: false })
  is_verified!: boolean;

  @Column({ type: 'text', nullable: true })
  refresh_token!: string | null;

  @Column({ nullable: true })
  profile_id!: string;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  last_active_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;

  @OneToMany(() => SocialAccount, (socialAccount) => socialAccount.user)
  socialAccounts!: SocialAccount[];

  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  requester_friendships!: Friendship[];

  @OneToMany(() => Friendship, (friendship) => friendship.addressee)
  addressee_friendships!: Friendship[];

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
