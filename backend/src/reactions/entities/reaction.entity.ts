import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "@/users/entities/user.entity";

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  HAHA = 'haha',
  WOW = 'wow',
  SAD = 'sad',
  ANGRY = 'angry',
}

export enum ReactionTargetType {
  POST = 'post',
  COMMENT = 'comment',
  MESSAGE = 'message',
}

@Entity('reactions')
@Index(['target_type', 'target_id', 'author_id'], { unique: true })
@Index(['target_type', 'target_id'])

export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({type: 'enum', enum: ReactionTargetType })
  target_type!: ReactionTargetType;

  @Column()
  @Index()
  target_id!: string;

  @Column()
  @Index()
  author_id!: string;

  @Column({
    type: 'enum',
    enum: ReactionType
  })
  type!: ReactionType;

  @ManyToOne(() => User, (user) => user.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @CreateDateColumn()
  created_at!: Date;
}