import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PostMedia } from "./post-media.entity";
import { Message_Media } from "@/conversations/entities/message-medias.entity";

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other',
}

@Entity('medias')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  url!: string;

  @Column()
  public_id!: string;

  @Column({
    type: 'enum',
    enum: MediaType,
    default: MediaType.OTHER
  })
  type: MediaType = MediaType.OTHER;

  @Column()
  resource_type!: string; // cloudinary

  @Column({ nullable: true })
  format?: string;

  @Column({ nullable: true })
  bytes?: number;

  @Column({ nullable: true })
  width?: number;

  @Column({ nullable: true })
  height?: number;

  @Column({ nullable: true })
  duration?: number;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => PostMedia, (postMedia) => postMedia.media)
  post_media?: PostMedia[];

  @OneToMany(() => Message_Media, (message_media) => message_media.media)
  message_media?: Message_Media[]
}