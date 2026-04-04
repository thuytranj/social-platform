import { Check, Column, CreateDateColumn, Entity, In, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { User } from "../../users/entities/user.entity";

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

@Entity('friendships')
@Unique(['user_low_id', 'user_high_id'])
@Index(['requester_id'])
@Index(['addressee_id'])
@Index(['status'])
@Index(['user_low_id', 'user_high_id'])
@Check(`"requester_id" <> "addressee_id"`)
export class Friendship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  requester_id: string;

  @Column()
  addressee_id: string;

  @Column({
    type: 'enum',
    enum: FriendshipStatus,
    default: FriendshipStatus.PENDING,
  })
  status: FriendshipStatus;

  @Column()
  user_low_id: string;

  @Column()
  user_high_id: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.requester_friendships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @ManyToOne(() => User, (user) => user.addressee_friendships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'addressee_id' })
  addressee: User;
}