import { Expose } from "class-transformer";

export class MediaResponseDto {
  @Expose()
  id!: string;

  @Expose()
  url!: string;

  @Expose()
  type!: string;

  @Expose()
  bytes!: number;

  @Expose()
  width!: number;

  @Expose()
  height!: number;

  @Expose()
  duration!: number;

  @Expose()
  created_at!: Date;
}