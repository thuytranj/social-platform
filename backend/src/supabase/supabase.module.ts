import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { ConfigModule } from '@nestjs/config';
import { FilesService } from './files.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([File])],
  providers: [SupabaseService, FilesService],
  exports: [SupabaseService, FilesService]
})
export class SupabaseModule {}
