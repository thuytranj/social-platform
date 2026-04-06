import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { CloudinaryService } from '@/integrations/cloudinary.service';
import { MediaType } from "@/medias/entities/media.entity";

@Injectable()
export class MediasService {
  constructor(@InjectRepository(Media) private mediasRepository: Repository<Media>,
    private readonly cloudinaryService: CloudinaryService) { }
  
  async uploadAndSave(file: Express.Multer.File) {
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/') ) {
      throw new Error('Unsupported file type');
    }

    const uploadResult = await this.cloudinaryService.uploadFile(file);

    const media = this.mediasRepository.create({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      type: this.mapMediaType(uploadResult.resource_type, uploadResult.format),
      resource_type: uploadResult.resource_type,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration || null,
    });

    return this.mediasRepository.save(media);
  }

  private mapMediaType(resourceType: string, format: string): MediaType {
    if (resourceType === 'image') {
      return MediaType.IMAGE;
    }
    if (resourceType === 'video') {
      if (format === 'mp3' || format === 'wav' || format === 'ogg') {
        return MediaType.AUDIO;
      }
      return MediaType.VIDEO;
    }
    return MediaType.OTHER;
  }
}
