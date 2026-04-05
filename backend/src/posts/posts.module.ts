import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feed } from './entities/feeds.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Feed])],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
