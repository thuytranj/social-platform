import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Conversation } from "./conversation.entity";
import { User } from "@/users/entities/user.entity";
import { Message } from "./message.entity";

export enum ConversationMemberRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

@Index(['conversation_id', 'user_id'], { unique: true })
@Entity('conversation_members')
export class ConversationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  @Index()
  conversation_id: string

  @Column('uuid')
  @Index()
  user_id: string

  @Column({
    type: 'enum',
    enum: ConversationMemberRole,
    default: ConversationMemberRole.MEMBER
  })
  role: ConversationMemberRole

  @Column({default: 0})
  unread_count: number

  @Column({type: 'timestamptz', nullable: true})
  last_read_at?: Date
  
  @Column({nullable: true})
  @Index()
  last_read_message_id?: string

  @CreateDateColumn()
  joined_at: Date

  @ManyToOne(() => Conversation, (conversation) => conversation.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, (user) => user.conversation_members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Message, (message) => message.last_read_message, {
    onDelete: 'SET NULL',
    nullable: true
  })
  @JoinColumn({ name: 'last_read_message_id' })
  last_read_message?: Message;
}