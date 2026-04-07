import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, Post as PostEntity, PostPrivacy } from './entities/post.entity';
import { DataSource, In, Repository } from 'typeorm';
import { MediasService } from '@/medias/medias.service';
import { plainToInstance } from 'class-transformer';
import { PostResponseDto } from './dto/post-response.dto';
import { Feed } from './entities/feeds.entity';
import { Friendship, FriendshipStatus } from '@/friendships/entities/friendship.entity';
import { PostMedia } from '@/medias/entities/post-media.entity';
import { CloudinaryService } from '@/integrations/cloudinary.service';
import { Media } from '@/medias/entities/media.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    private readonly mediasService: MediasService,
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    authorId: string,
    createPostDto: CreatePostDto,
    files: Express.Multer.File[] = [],
  ) {
    if (!createPostDto.content && files.length === 0) {
      throw new BadRequestException('Post must have content or media');
    }

    const uploadMedias = await Promise.all(
      files.map((file) => {
        return this.cloudinaryService.uploadFile(file)
      }),
    );

    try {
      return await this.dataSource.transaction(async (manager) => { 
        const postRepo = manager.getRepository(Post);
        const postMediaRepo = manager.getRepository(PostMedia);
        const feedRepo = manager.getRepository(Feed);
        const mediaRepo = manager.getRepository(Media);

        const post = postRepo.create({
          ...createPostDto,
          author_id: authorId,
          privacy: createPostDto.privacy ?? PostPrivacy.PUBLIC,
          content: createPostDto.content?.trim() || '',
        });
        const savedPost = await postRepo.save(post);

        const mediaEntities = uploadMedias.map((upload) => {
          return mediaRepo.create({
            url: upload.secure_url,
            public_id: upload.public_id,
            type: this.mediasService.mapMediaType(upload.resource_type, upload.format),
            resource_type: upload.resource_type,
            format: upload.format,
            bytes: upload.bytes,
            width: upload.width,
            height: upload.height,
            duration: upload.duration ?? null,
          });
        });

        const savedMedias = await mediaRepo.save(mediaEntities);

        if (savedMedias.length) {
          const postMedias = savedMedias.map((media) => {
            return postMediaRepo.create({
              post_id: savedPost.id,
              media_id: media.id,
            });
          });
          await postMediaRepo.save(postMedias);
        }
        
        let feedEntries : Feed[] = [];

        if (savedPost.privacy !== PostPrivacy.PRIVATE) {
          const friendIds = await this.friendshipRepository
            .createQueryBuilder('friendship')
            .select('CASE WHEN friendship.requester_id = :authorId THEN friendship.addressee_id ELSE friendship.requester_id END', 'friendId')
            .where('friendship.requester_id = :authorId OR friendship.addressee_id = :authorId', { authorId })
            .andWhere('friendship.status = :status', { status: FriendshipStatus.ACCEPTED })
            .getRawMany()
        
          feedEntries = friendIds.map((f) => {
            return feedRepo.create({
              user_id: f.friendId,
              post_id: savedPost.id,
            });
          });
        }

        feedEntries.push(
          feedRepo.create({
            user_id: authorId,
            post_id: savedPost.id,
          }),
        );

        await feedRepo.save(feedEntries);

        const result = await postRepo.findOne({
          where: { id: savedPost.id },
          relations: ['postMedias', 'postMedias.media', 'author'],
        });

        return plainToInstance(PostResponseDto, result, { excludeExtraneousValues: true });
      });
    } catch (error) {
      await Promise.all(
        uploadMedias.map((media) =>
          this.cloudinaryService.deleteFile(
            media.public_id,
            media.resource_type,
          ),
        ),
      );
      throw error;
    }
  }

  async findAllUserFeeds(userId: string, page: number = 1, limit: number = 10) {
    // Calculate the number of items to skip based on the page and limit
    const skip = (page - 1) * limit;
    const [posts, total] = await this.feedRepository.findAndCount({
      where: { user_id: userId },
      relations: ['post', 'post.postMedias', 'post.postMedias.media', 'post.author'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    })

    // Transform the posts to PostResponseDto
    const data = await posts.map((post) => plainToInstance(PostResponseDto, post.post, { excludeExtraneousValues: true }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }
  }

  async findOne(id: string) {
    const result = await this.postsRepository.findOne({
      where: { id },
      relations: ['postMedias', 'postMedias.media', 'author'],
    });
    return plainToInstance(PostResponseDto, result, { excludeExtraneousValues: true });
  }

  async findPostsByUserId(actorId:string, userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    let friendship = false;

    if (actorId === userId) {
      friendship = true; 
    } else {
      const friend = await this.friendshipRepository.createQueryBuilder('friendship')
        .where('(friendship.requester_id = :actorId AND friendship.addressee_id = :userId) OR (friendship.requester_id = :userId AND friendship.addressee_id = :actorId)', { actorId, userId })
        .andWhere('friendship.status = :status', { status: FriendshipStatus.ACCEPTED })
        .getOne();
      
      friendship = !!friend;
    }

    let privacyFilter;

    if (actorId === userId) {
      privacyFilter = [PostPrivacy.PUBLIC, PostPrivacy.FRIENDS_ONLY, PostPrivacy.PRIVATE];
    } else if (friendship) {
      privacyFilter = [PostPrivacy.PUBLIC, PostPrivacy.FRIENDS_ONLY];
    } else {
      privacyFilter = [PostPrivacy.PUBLIC];
    }

    const [posts, total] = await this.postsRepository.findAndCount({
      where: { author_id: userId, privacy: In (privacyFilter) },
      relations: ['postMedias', 'postMedias.media', 'author'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: posts.map((post) => plainToInstance(PostResponseDto, post, { excludeExtraneousValues: true })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async findPostsByGroupId(groupId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [posts, total] = await this.postsRepository.findAndCount({
      where: { group_id: groupId },
      relations: ['postMedias', 'postMedias.media', 'author'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    })

    return {
      data: posts.map((post) =>
        plainToInstance(PostResponseDto, post, {
          excludeExtraneousValues: true,
        })
      ),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  } 

  async update(userId: string, id: string, updatePostDto: UpdatePostDto) {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new BadRequestException('Post not found');
    }

    if (post.author_id !== userId) {
      throw new BadRequestException('You are not the author of this post');
    }

    Object.assign(post, {
      ...updatePostDto,
      content: updatePostDto.content?.trim() ?? post.content,
      privacy: updatePostDto.privacy ?? post.privacy,
    });
    return plainToInstance(PostResponseDto, await this.postsRepository.save(post), { excludeExtraneousValues: true });
  }

  async remove(userId: string, id: string) {
    return this.dataSource.transaction(async (manager) => {
      const postRepo = manager.getRepository(Post);
      const postMediaRepo = manager.getRepository(PostMedia);
      const mediaRepo = manager.getRepository(Media);

      const post = await postRepo.findOne({ where: { id }, relations: ['postMedias', 'postMedias.media'] });

      if (!post) {
        throw new BadRequestException('Post not found');
      }

      if (post.author_id !== userId) {
        throw new BadRequestException('You are not the author of this post');
      }

      const mediaToDelete = post.postMedias?.map((pm) => pm.media) || [];

      await postRepo.delete(id);

      if (mediaToDelete.length) {
        const mediaIds = mediaToDelete.map((m) => m.id);

        await mediaRepo.delete({ id: In(mediaIds) });

        await Promise.all(
          mediaToDelete.map((media) =>
            this.cloudinaryService.deleteFile(
              media.public_id,
              media.resource_type,
            ),
          ),
        );
      }

      return { message: 'Post deleted successfully' };
    })
  }

  async detachMediaFromPost(userId: string, postId: string, mediaId: string) {
    return this.dataSource.transaction(async (manager) => {
      const postMediaRepo = manager.getRepository(PostMedia);
      const mediaRepo = manager.getRepository(Media);

      const postMedia = await postMediaRepo.findOne({ where: { post_id: postId, media_id: mediaId }, relations: ['media', 'post'] });

      if (!postMedia) {
        throw new BadRequestException('Media not found in post');
      }

      if (postMedia.post.author_id !== userId) {
        throw new BadRequestException('You are not the author of this post');
      }

      const media = postMedia.media;

      await postMediaRepo.delete({post_id: postId, media_id: mediaId});
      await mediaRepo.delete({ id: mediaId });
      
      try {
        await this.cloudinaryService.deleteFile(media.public_id, media.resource_type);
      } catch (error) {
        console.error('Failed to delete media from Cloudinary', error);
      }

      return { message: 'Media detached from post successfully' };
    })
  }
}
