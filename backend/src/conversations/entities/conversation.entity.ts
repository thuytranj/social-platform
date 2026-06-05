import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, Unique } from "typeorm";
import {v7 as uuidv7} from 'uuid'
import { Message } from "./message.entity";
import { ConversationMember } from "./conversation-member.entity";
import { User } from "@/users/entities/user.entity";

export enum ConversationType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP'
}

@Index(['last_message_time', 'id'])
@Unique(['private_key'])
@Entity('conversations')
export class Conversation {
  @PrimaryColumn('uuid')
  id: string
  
  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.PRIVATE
  })
  type: ConversationType

  @Column({nullable: true})
  title?: string

  @Column({nullable: true})
  thumbnail_url?: string

  @Column({nullable: true})
  thumbnail_public_url?: string

  @Column({nullable: true})
  last_message_id?: string
  
  @Column({type: 'timestamptz', nullable: true})
  last_message_time?: Date

  @Index()
  @Column()
  creator_id: string

  @Index()
  @Column({nullable: true})
  private_key?: string
  
  @CreateDateColumn()
  created_at: Date
  
  @UpdateDateColumn({type: 'timestamptz'})
  updated_at: Date
  
  @BeforeInsert()
  generateId() {
    this.id = uuidv7()
  }

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
  
  @OneToMany(() => ConversationMember, (conversation_member) => conversation_member.conversation)
  members: ConversationMember[];

  @ManyToOne(() => User, (user) => user.conversations_created)
  @JoinColumn({name: 'creator_id'})
  creator: User

  @ManyToOne(() => Message, (message) => message.last_message_conversations, {
    onDelete: 'SET NULL',
    nullable: true
  })
  @JoinColumn({name: 'last_message_id'})
  last_message?: Message
}
