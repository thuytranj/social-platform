import { Expose, Type } from "class-transformer";
import { MediaResponseDto } from "./media-reponse.dto";

export class PostMediaResponseDto {
  @Expose()
  @Type(() => MediaResponseDto)
  media!: MediaResponseDto;
}