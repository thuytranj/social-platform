import { Module, forwardRef } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { ReactionsController } from './reactions.controller';
import { Reaction } from './entities/reaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsModule } from '@/conversations/conversations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reaction]), forwardRef(() => ConversationsModule)],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
