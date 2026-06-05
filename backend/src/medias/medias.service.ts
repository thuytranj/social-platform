import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { MediaType } from '@/medias/entities/media.entity';

@Injectable()
export class MediasService {
  constructor(
    @InjectRepository(Media) private mediasRepository: Repository<Media>,
  ) {}

  private getMediaRepository(manager?: EntityManager) {
    return manager?.getRepository(Media) ?? this.mediasRepository;
  }

  mapMediaType(resourceType: string, format: string): MediaType {
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

  findOne(id: string, manager?: EntityManager) {
    const mediaRepository = this.getMediaRepository(manager);
    return mediaRepository.findOne({ where: { id } });
  }
}
