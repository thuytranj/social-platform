import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PostMedia } from "./entities/post-media.entity";

@Injectable()
export class PostMediaService {
  constructor(@InjectRepository(PostMedia) private postMediasRepository: Repository<PostMedia>) { }

  async attachMediaToPost(postId: string, mediaId: string[]) {
    const postMediaEntities = mediaId.map(id => {
      return this.postMediasRepository.create({
        post_id: postId,
        media_id: id,
      });
    });

    await this.postMediasRepository.save(postMediaEntities);
  }
}