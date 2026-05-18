import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationMember } from './entities/conversation-member.entity';
import { Message } from './entities/message.entity';
import { Message_Media } from './entities/message-medias.entity';
import { MediasModule } from '@/medias/medias.module';
import { ConversationMembersService } from './conversation-members.service';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationMember, Message, Message_Media]),
    MediasModule,
    UsersModule
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationMembersService],
  exports: [ConversationsService, ConversationMembersService]
})
export class ConversationsModule {}
