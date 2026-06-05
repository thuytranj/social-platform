import { User } from "@/users/entities/user.entity";
import { Comment } from "@/comments/entities/comment.entity";
import { CreateDateColumn, Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn, ManyToOne, OneToMany, Index } from "typeorm";
import { Group } from "@/groups/entities/group.entity";
import { Feed } from "./feeds.entity";
import { PostMedia } from "@/medias/entities/post-media.entity";
import { File } from "@/supabase/entities/file.entity";

export enum PostPrivacy {
  PUBLIC = 'public',
  FRIENDS_ONLY = 'friends_only',
  PRIVATE = 'private',
}

@Entity('posts')
@Index(['created_at'])
@Index(['author_id', 'created_at'])
@Index(['group_id', 'created_at'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  author_id!: string;

  @Column({ nullable: true })
  @Index()
  group_id?: string;

  @Column()
  content!: string;

  @Column({
    type: 'enum',
    enum: PostPrivacy,
    default: PostPrivacy.PUBLIC
  })
  privacy: PostPrivacy = PostPrivacy.PUBLIC;

  @Column({ default: 0 })
  react_count!: number ;
  
  @Column({ default: 0 })
  comment_count!: number;

  @Column({ default: 0 })
  share_count!: number;

  @Column({ nullable: true })
  @Index()
  original_post_id?: string;

  @Column({ nullable: true })
  @Index()
  root_post_id?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];

  @ManyToOne(() => Group, (group) => group.posts)
  @JoinColumn({ name: 'group_id' })
  group?: Group;

  @OneToMany(() => Feed, (feed) => feed.post)
  feeds!: Feed[];

  @OneToMany(() => PostMedia, (postMedia) => postMedia.post)
  postMedias!: PostMedia[];

  // For shared posts, these fields link back to the original and root posts
  @ManyToOne(() => Post, (post) => post.direct_shares, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'original_post_id' })
  original_post?: Post;

  @ManyToOne(() => Post, (post) => post.all_shares, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'root_post_id' })
  root_post?: Post;

  @OneToMany(() => Post, (post) => post.original_post)
  direct_shares!: Post[];

  @OneToMany(() => Post, (post) => post.root_post)
  all_shares!: Post[];

  @OneToMany(() => File, (file) => file.post)
  files: File[];
}
