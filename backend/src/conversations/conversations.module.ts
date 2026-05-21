import { Module, forwardRef } from '@nestjs/common';
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
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { SupabaseModule } from '@/supabase/supabase.module';
import { Media } from '@/medias/entities/media.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConversationGateway } from './conversation.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { ReactionsModule } from '@/reactions/reactions.module';

const parseExpiresIn = (value?: string): number | StringValue | undefined => {
  if (!value) {
    return undefined;
  }

  return /^\d+$/.test(value) ? Number(value) : (value as StringValue);
};

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationMember, Message, Message_Media, Media]),
    MediasModule,
    forwardRef(() => UsersModule),
    SupabaseModule,
    forwardRef(() => ReactionsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: parseExpiresIn(
            configService.get<string>('ACCESS_TOKEN_EXPIRES_IN'),
          ),
        },
      }),
    }),
  ],
  controllers: [ConversationsController, MessagesController],
  providers: [ConversationsService, ConversationMembersService, MessagesService, ConversationGateway],
  exports: [ConversationsService, ConversationMembersService, MessagesService]
})
export class ConversationsModule {}
