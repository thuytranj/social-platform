import { Post } from "@/posts/entities/post.entity";
import { User } from "@/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('comments')
@Index(['post_id', 'created_at'])
@Index(['parent_id', 'created_at'])
export class Comment { 
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  post_id!: string;

  @Column()
  @Index()
  author_id!: string;

  @Column({ nullable: true })
  @Index()
  parent_id?: string;

  @Column()
  content!: string;

  @CreateDateColumn()
  created_at!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  // Self-referential relationship for nested comments
  @OneToMany(() => Comment, (comment) => comment.parent)
  replies!: Comment[];

  @ManyToOne(() => Comment, (comment) => comment.replies, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Comment;
}

