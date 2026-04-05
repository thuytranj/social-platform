import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { User } from "@/users/entities/user.entity";

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  HAHA = 'haha',
  WOW = 'wow',
  SAD = 'sad',
  ANGRY = 'angry',
}

@Entity('reactions')
  @Index(['target_type', 'target_id', 'author_id'], { unique: true })
  @Index(['target_type', 'target_id'])
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({type: 'enum', enum: ['post', 'comment'] })
  target_type!: 'post' | 'comment';

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
  author!: User;

  @CreateDateColumn()
  created_at!: Date;
}