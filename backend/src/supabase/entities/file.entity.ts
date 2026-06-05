import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { Message } from "@/conversations/entities/message.entity";
import { Post } from "@/posts/entities/post.entity";
import { Comment } from "@/comments/entities/comment.entity";

export enum Bucket {
  MESSAGES = 'chat_files',
  POSTS = 'post_files',
  COMMENTS = 'comment_files',
}

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({nullable: true})
  @Index()
  message_id?: string;

  @Column({nullable: true})
  @Index()
  post_id?: string;

  @Column({nullable: true})
  @Index()
  comment_id?: string;

  @Column()
  url: string; 

  @Column()
  file_name: string;

  @Column()
  original_name: string;

  @Column({ nullable: true })
  file_size?: number;

  @Column({ nullable: true })
  mime_type?: string; 

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Message, (message) => message.files, {
    onDelete: 'CASCADE',
    nullable: true
  })
  @JoinColumn({ name: 'message_id' })
  message?: Message;

  @ManyToOne(() => Post, (post) => post.files, {
    onDelete: 'CASCADE',
    nullable: true
  })
  @JoinColumn({ name: 'post_id' })
  post?: Post;

  @ManyToOne(() => Comment, (comment) => comment.files, {
    onDelete: 'CASCADE',
    nullable: true
  })
  @JoinColumn({ name: 'comment_id' })
  comment?: Comment;
}