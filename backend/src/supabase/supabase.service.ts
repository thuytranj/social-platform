import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService implements OnModuleInit{
  private supabaseClient: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
  ) {}
  
  async onModuleInit() {
    this.supabaseClient = createClient(
      this.configService.getOrThrow('SUPABASE_URL'), 
      this.configService.getOrThrow('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Ensure storage buckets exist
    const bucketsToCreate = ['chat_files', 'post_files', 'comment_files'];
    try {
      const { data: list, error: listError } = await this.supabaseClient.storage.listBuckets();
      if (listError) throw listError;

      for (const bucketName of bucketsToCreate) {
        const exists = list?.some(b => b.id === bucketName);
        if (!exists) {
          const { error: createError } = await this.supabaseClient.storage.createBucket(bucketName, {
            public: false,
          });
          if (createError) {
            console.error(`Failed to create bucket ${bucketName}:`, createError);
          } else {
            console.log(`Successfully created Supabase bucket: ${bucketName}`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to ensure Supabase storage buckets exist:', err);
    }
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

  async getDownloadUrl(fileName: string, bucketName: string) {
    const { data, error } = await this.supabaseClient.storage
      .from(bucketName)
      .createSignedUrl(fileName, 60 * 15);

    if (error) throw error;

    return data.signedUrl;
  }

  async deleteFile(fileName: string, bucketName: string) {
    const { error } = await this.supabaseClient.storage
      .from(bucketName)
      .remove([fileName]);
    
    if(error) throw error;
  }

}
