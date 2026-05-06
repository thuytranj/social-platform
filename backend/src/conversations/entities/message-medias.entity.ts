import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Message } from "./message.entity";
import { Media } from "@/medias/entities/media.entity";

@Index(['message_id', 'media_id'], {unique: true})
@Entity('message_medias')
export class Message_Media {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  message_id: string

  @Column()
  media_id: string

  @ManyToOne(() => Message, (message) => message.message_medias)
  @JoinColumn({name: 'message_id'})
  message: Message

  @ManyToOne(() => Media, (media) => media.message_media)
  @JoinColumn({name: 'media_id'})
  media: Media
}