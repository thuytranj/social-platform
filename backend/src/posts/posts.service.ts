import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostEntity, PostPrivacy } from './entities/post.entity';
import { Repository } from 'typeorm';
import { MediasService } from '@/medias/medias.service';
import { PostMediaService } from '@/medias/post-media.service';
import { plainToInstance } from 'class-transformer';
import { PostResponseDto } from './dto/post-response.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    private readonly mediasService: MediasService,
    private readonly postMediaService: PostMediaService,
  ) {}

  async create(
    authorId: string,
    createPostDto: CreatePostDto,
    files: Express.Multer.File[] = [],
  ) {
    if (!createPostDto.content?.trim() && files.length === 0) {
      throw new BadRequestException(
        'Post must have content or at least one media file.',
      );
    }

    const post = this.postsRepository.create({
      ...createPostDto,
      author_id: authorId,
      privacy: createPostDto.privacy ?? PostPrivacy.PUBLIC,
      content: createPostDto.content?.trim() ?? '',
    });

    const savedPost = await this.postsRepository.save(post);

    if (files.length > 0) {
      const uploadedMedias = await Promise.all(
        files.map((file) => this.mediasService.uploadAndSave(file)),
      );

      await this.postMediaService.attachMediaToPost(
        savedPost.id,
        uploadedMedias.map((media) => media.id),
      );
    }

    const result = await this.postsRepository.findOne({
      where: { id: savedPost.id },
      relations: ['postMedias', 'postMedias.media', 'author'],
    });
    return plainToInstance(PostResponseDto, result, { excludeExtraneousValues: true });
  }

  findAll() {
    return `This action returns all posts`;
  }

  async findOne(id: string) {
    const result = await this.postsRepository.findOne({
      where: { id },
      relations: ['postMedias', 'postMedias.media', 'author'],
    });
    return plainToInstance(PostResponseDto, result, { excludeExtraneousValues: true });
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new BadRequestException('Post not found');
    }
    Object.assign(post, updatePostDto);
    return plainToInstance(PostResponseDto, await this.postsRepository.save(post), { excludeExtraneousValues: true });
  }

  remove(id: string) {
    return this.postsRepository.delete(id);
  }
}
