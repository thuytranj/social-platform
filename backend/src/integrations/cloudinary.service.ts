import { BadRequestException, Injectable } from '@nestjs/common';
import * as streamifier from 'streamifier';
import cloudinary from '@/config/cloudinary.config';

@Injectable()
export class CloudinaryService {
  async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const resourceType = file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'raw';

    return new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'social_platform',
         },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string, resourceType: string) {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }
}