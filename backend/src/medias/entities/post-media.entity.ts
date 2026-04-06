import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "@/posts/entities/post.entity";
import { Media } from "@/medias/entities/media.entity";

@Entity("post_medias")
@Index(['post_id', 'media_id'], { unique: true })
export class PostMedia {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  post_id!: string;

  @Column()
  @Index()
  media_id!: string;

  // Relationships
  @ManyToOne(() => Post, (post) => post.postMedias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @ManyToOne(() => Media, (media) => media.post_media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_id' })
  media!: Media;
}