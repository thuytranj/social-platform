import { CreateDateColumn, Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum PostPrivacy {
  PUBLIC = 'public',
  FRIENDS_ONLY = 'friends_only',
  PRIVATE = 'private',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  author_id!: string;

  @Column()
  content!: string;

  @Column({
    type: 'enum',
    enum: PostPrivacy,
    default: PostPrivacy.PUBLIC
  })
  privacy: PostPrivacy = PostPrivacy.PUBLIC;

  @Column()
  react_count: number = 0;
  
  @Column()
  comment_count: number = 0;

  @Column()
  share_count: number = 0;

  @Column({ nullable: true })
  original_post_id?: string;

  @Column({ nullable: true })
  root_post_id?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
