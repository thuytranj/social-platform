import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feed } from './entities/feeds.entity';
import { MediasModule } from '@/medias/medias.module';
import { Friendship } from '@/friendships/entities/friendship.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Feed, Friendship]), MediasModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
