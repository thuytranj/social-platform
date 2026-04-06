import { Module, Post } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MediasController } from './medias.controller';
import { Media } from './entities/media.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostMedia } from './entities/post-media.entity';
import { PostMediaService } from './post-media.service';
import { CloudinaryService } from '@/integrations/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Media, PostMedia])],
  controllers: [MediasController],
  providers: [MediasService, PostMediaService, CloudinaryService],
  exports: [MediasService, PostMediaService, CloudinaryService],
})
export class MediasModule {}
