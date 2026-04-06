import { Controller, UseInterceptors, Post, UploadedFile } from '@nestjs/common';
import { MediasService } from './medias.service';
import { memoryStorage } from 'multer';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('medias')
export class MediasController {
  constructor(private readonly mediasService: MediasService) { }
  
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.mediasService.uploadAndSave(file);
  }

  @Post('upload-multiple')
  @UseInterceptors(
  FilesInterceptor('files', 10, {
    storage: memoryStorage(),
  }),
)
  async uploadMultiple(@UploadedFile() files: Express.Multer.File[]) {
    return Promise.all(files.map(file => this.mediasService.uploadAndSave(file)));
  }
}
