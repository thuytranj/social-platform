import { Expose } from "class-transformer";

export class FileResponseDto {
  @Expose()
  id: string;

  @Expose()
  url: string;

  @Expose()
  original_name: string;

  @Expose()
  file_size: number;

  @Expose()
  mime_type: string;

  @Expose()
  created_at: Date;
}