import { CreateDateColumn, Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, Index } from "typeorm";
import { Group } from "./group.entity";
import { User } from "@/users/entities/user.entity";

export enum GroupRole {
  MEMBER = 'member',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export enum GroupStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
  PENDING = 'pending',
}

@Entity('group_members')
@Index(['group_id', 'user_id'], { unique: true })
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  group_id!: string;

  @Column()
  @Index()
  user_id!: string;

  @Column({
    type: 'enum',
    enum: GroupRole,
    default: GroupRole.MEMBER
  })
  role: GroupRole = GroupRole.MEMBER;

  @Column({
    type: 'enum',
    enum: GroupStatus,
    default: GroupStatus.ACTIVE
  })
  status: GroupStatus = GroupStatus.ACTIVE;

  @CreateDateColumn()
  joined_at!: Date;

  @ManyToOne(() => Group, (group) => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group!: Group;

  @ManyToOne(() => User, (user) => user.group_memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}