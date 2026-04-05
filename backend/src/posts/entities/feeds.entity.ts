import { Column, Entity, JoinColumn, PrimaryGeneratedColumn, ManyToOne, Index, CreateDateColumn } from "typeorm";
import { User } from "@/users/entities/user.entity";
import { Post } from "./post.entity";

@Entity('feeds')
  @Index(['user_id', 'created_at'])
  @Index(['user_id', 'post_id'], { unique: true })
export class Feed {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  user_id!: string;

  @Column()
  @Index()
  post_id!: string;

  @CreateDateColumn()
  created_at!: Date;

  // Relationships

  @ManyToOne(() => User, (user) => user.feeds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Post, (post) => post.feeds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;
}