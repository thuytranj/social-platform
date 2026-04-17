import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "@/users/entities/user.entity";
import { GroupMember } from "./group-member.entity";
import { Post } from "@/posts/entities/post.entity";

export enum GroupPrivacy {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  name!: string;

  @Column({type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  cover_url?: string;

  @Column({ nullable: true })
  cover_public_id?: string;

  @Column()
  @Index()
  creator_id!: string;

  @Column({
    type: 'enum',
    enum: GroupPrivacy,
    default: GroupPrivacy.PUBLIC
  })
  privacy: GroupPrivacy = GroupPrivacy.PUBLIC;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ default: 0 })
  members_count: number = 0;

  @ManyToOne(() => User, (user) => user.created_groups, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creator_id' })
  creator!: User;

  @OneToMany(() => GroupMember, (groupMember) => groupMember.group)
  members!: GroupMember[];

  @OneToMany(() => Post, (post) => post.group)
  posts!: Post[];
}