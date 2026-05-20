import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService implements OnModuleInit{
  private supabaseClient: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
  ) {}
  
  onModuleInit() {
    this.supabaseClient = createClient(
      this.configService.getOrThrow('SUPABASE_URL'), 
      this.configService.getOrThrow('SUPABASE_SERVICE_ROLE_KEY')
    )
  }

  async uploadFile(bucketName: string, file: Express.Multer.File) {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedName}`;
    const { data, error } = await this.supabaseClient.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });
    
    if(error) throw error;

    const { data: urlData } = this.supabaseClient.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    return {
      file_name: fileName,
      original_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      url: urlData.publicUrl,
    }
  }

  async deleteFile(fileName: string, bucketName: string) {
    const { error } = await this.supabaseClient.storage
      .from(bucketName)
      .remove([fileName]);
    
    if(error) throw error;
  }

}
