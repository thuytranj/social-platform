import { Module, Post } from '@nestjs/common';
import { MediasService } from './medias.service';
import { Media } from './entities/media.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostMedia } from './entities/post-media.entity';
import { CloudinaryService } from '@/integrations/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Media, PostMedia])],
  controllers: [],
  providers: [MediasService, CloudinaryService],
  exports: [MediasService, CloudinaryService],
})
export class MediasModule {}
