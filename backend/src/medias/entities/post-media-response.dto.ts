import { Expose, Type } from "class-transformer";
import { MediaResponseDto } from "./media-response.dto";

export class PostMediaResponseDto {
  @Expose()
  @Type(() => MediaResponseDto)
  media!: MediaResponseDto;
}