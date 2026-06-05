import { BeforeInsert, Column, Entity, ManyToOne, PrimaryColumn, JoinColumn, OneToMany, Index, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import {v7 as uuidv7} from 'uuid'
import { Conversation } from "./conversation.entity";
import { User } from "@/users/entities/user.entity";
import { Message_Media } from "./message-medias.entity";
import { ConversationMember } from "./conversation-member.entity";
import { File } from "@/supabase/entities/file.entity";

export enum MessageType {
  TEXT = 'text',
  REVOKED = 'revoked',
  SYSTEM = 'system'
}

@Index(['conversation_id', 'sent_at'])
@Entity('messages')
export class Message {
  @PrimaryColumn('uuid')
  id: string

  @Column()
  @Index()
  conversation_id: string

  @Column()
  @Index()
  sender_id: string

  @Column({nullable: true})
  @Index()
  reply_message_id?: string

  @Column({type: 'enum', enum: MessageType, default: MessageType.TEXT})
  message_type: MessageType;

  @Column({nullable: true})
  content?: string

  @Column({default: 0})
  react_count: number;

  @Column({
    name: 'sent_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Index()
  sent_at: Date;

  @UpdateDateColumn({type: 'timestamptz'})
  updated_at: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv7()
  }

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id'})
  conversation: Conversation;

  @ManyToOne(() => User, (user) => user.sent_messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @OneToMany(() => Message_Media, (message_media) => message_media.message)
  message_medias: Message_Media[];

  @ManyToOne(() => Message, (message) => message.replies, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'reply_message_id' })
  reply_message?: Message;

  @OneToMany(() => Message, (message) => message.reply_message)
  replies: Message[];

  @OneToMany(() => Conversation, (conversation) => conversation.last_message)
  last_message_conversations?: Conversation;

  @OneToMany(() => ConversationMember, (conversation_member) => conversation_member.last_read_message)
  last_read_message?: ConversationMember[];

  @OneToMany(() => File, (file) => file.message)
  files: File[];
}