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
import {
  Friendship,
  FriendshipStatus,
} from '@/friendships/entities/friendship.entity';
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
        return this.cloudinaryService.uploadFile(file);
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
            type: this.mediasService.mapMediaType(
              upload.resource_type,
              upload.format,
            ),
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

        let feedEntries: Feed[] = [];

        if (savedPost.privacy !== PostPrivacy.PRIVATE) {
          const friendIds = await this.friendshipRepository
            .createQueryBuilder('friendship')
            .select(
              'CASE WHEN friendship.requester_id = :authorId THEN friendship.addressee_id ELSE friendship.requester_id END',
              'friendId',
            )
            .where(
              'friendship.requester_id = :authorId OR friendship.addressee_id = :authorId',
              { authorId },
            )
            .andWhere('friendship.status = :status', {
              status: FriendshipStatus.ACCEPTED,
            })
            .getRawMany();

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

        return plainToInstance(PostResponseDto, result, {
          excludeExtraneousValues: true,
        });
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

  private buildPrivacyCondition(aliasPost = 'post', aliasRoot = 'root') {
    return `
  (
    COALESCE(${aliasRoot}.privacy, ${aliasPost}.privacy) = :public

    OR (
      COALESCE(${aliasRoot}.privacy, ${aliasPost}.privacy) = :friends_only
      AND (
        COALESCE(${aliasRoot}.author_id, ${aliasPost}.author_id) = :viewerId
        OR EXISTS (
          SELECT 1 FROM friendships fr
          WHERE fr.status = :friendshipStatus
          AND (
            (fr.requester_id = :viewerId AND fr.addressee_id = COALESCE(${aliasRoot}.author_id, ${aliasPost}.author_id))
            OR
            (fr.addressee_id = :viewerId AND fr.requester_id = COALESCE(${aliasRoot}.author_id, ${aliasPost}.author_id))
          )
        )
      )
    )

    OR (
      COALESCE(${aliasRoot}.privacy, ${aliasPost}.privacy) = :private
      AND COALESCE(${aliasRoot}.author_id, ${aliasPost}.author_id) = :viewerId
    )
  )
  `;
  }

  async findAllUserFeeds(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const idsQb = await this.feedRepository
      .createQueryBuilder('feed')
      .innerJoin('feed.post', 'post')
      .leftJoin('post.root_post', 'root')
      .select('post.id', 'id')
      .where('feed.user_id = :userId', { userId })
      .andWhere(this.buildPrivacyCondition('post', 'root'), {
        viewerId: userId,
        public: PostPrivacy.PUBLIC,
        friends_only: PostPrivacy.FRIENDS_ONLY,
        private: PostPrivacy.PRIVATE,
        friendshipStatus: FriendshipStatus.ACCEPTED,
      })
      .orderBy('feed.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const postIds = (await idsQb.getRawMany()).map((row) => row.id);

    if (!postIds.length) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const posts = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.postMedias', 'pm')
      .leftJoinAndSelect('pm.media', 'media')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.original_post', 'originalPost')
      .leftJoinAndSelect('originalPost.author', 'originalPostAuthor')
      .leftJoinAndSelect('post.root_post', 'root')
      .leftJoinAndSelect('root.author', 'rootAuthor')
      .where('post.id IN (:...postIds)', { postIds })
      .orderBy(`array_position(ARRAY[:...postIds]::uuid[], post.id)`)
      .setParameter('postIds', postIds)
      .getMany();

    const total = await this.feedRepository
      .createQueryBuilder('feed')
      .innerJoin('feed.post', 'post')
      .leftJoin('post.root_post', 'root')
      .where('feed.user_id = :userId', { userId })
      .andWhere(this.buildPrivacyCondition('post', 'root'), {
        viewerId: userId,
        public: PostPrivacy.PUBLIC,
        friends_only: PostPrivacy.FRIENDS_ONLY,
        private: PostPrivacy.PRIVATE,
        friendshipStatus: FriendshipStatus.ACCEPTED,
      })
      .getCount();

    // Transform the posts to PostResponseDto
    const data = posts.map((post) =>
      plainToInstance(PostResponseDto, post, { excludeExtraneousValues: true }),
    );

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const result = await this.postsRepository.findOne({
      where: { id },
      relations: ['postMedias', 'postMedias.media', 'author'],
    });
    return plainToInstance(PostResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  async findPostsByUserId(
    actorId: string,
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const qb = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.postMedias', 'pm')
      .leftJoinAndSelect('pm.media', 'media')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.original_post', 'originalPost')
      .leftJoinAndSelect('originalPost.author', 'originalPostAuthor')
      .leftJoinAndSelect('post.root_post', 'root')
      .leftJoinAndSelect('root.author', 'rootAuthor')
      .where('post.author_id = :userId', { userId })
      .andWhere(this.buildPrivacyCondition('post', 'root'), {
        viewerId: actorId,
        public: PostPrivacy.PUBLIC,
        friends_only: PostPrivacy.FRIENDS_ONLY,
        private: PostPrivacy.PRIVATE,
        friendshipStatus: FriendshipStatus.ACCEPTED,
      })
      .orderBy('post.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .distinct(true);

    const [posts, total] = await qb.getManyAndCount();

    return {
      data: posts.map((post) =>
        plainToInstance(PostResponseDto, post, {
          excludeExtraneousValues: true,
        }),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPostsByGroupId(
    groupId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [posts, total] = await this.postsRepository.findAndCount({
      where: { group_id: groupId },
      relations: ['postMedias', 'postMedias.media', 'author'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: posts.map((post) =>
        plainToInstance(PostResponseDto, post, {
          excludeExtraneousValues: true,
        }),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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
    return plainToInstance(
      PostResponseDto,
      await this.postsRepository.save(post),
      { excludeExtraneousValues: true },
    );
  }

  async remove(userId: string, id: string) {
    return this.dataSource.transaction(async (manager) => {
      const postRepo = manager.getRepository(Post);
      const postMediaRepo = manager.getRepository(PostMedia);
      const mediaRepo = manager.getRepository(Media);

      const post = await postRepo.findOne({
        where: { id },
        relations: ['postMedias', 'postMedias.media'],
      });

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
    });
  }

  async detachMediaFromPost(userId: string, postId: string, mediaId: string) {
    return this.dataSource.transaction(async (manager) => {
      const postMediaRepo = manager.getRepository(PostMedia);
      const mediaRepo = manager.getRepository(Media);

      const postMedia = await postMediaRepo.findOne({
        where: { post_id: postId, media_id: mediaId },
        relations: ['media', 'post'],
      });

      if (!postMedia) {
        throw new BadRequestException('Media not found in post');
      }

      if (postMedia.post.author_id !== userId) {
        throw new BadRequestException('You are not the author of this post');
      }

      const media = postMedia.media;

      await postMediaRepo.delete({ post_id: postId, media_id: mediaId });
      await mediaRepo.delete({ id: mediaId });

      try {
        await this.cloudinaryService.deleteFile(
          media.public_id,
          media.resource_type,
        );
      } catch (error) {
        console.error('Failed to delete media from Cloudinary', error);
      }

      return { message: 'Media detached from post successfully' };
    });
  }

  async sharePost(userId: string, id: string, createPostDto: CreatePostDto) {
    return this.dataSource.transaction(async (manager) => {
      const postRepo = manager.getRepository(Post);
      const feedRepo = manager.getRepository(Feed);

      const orginalPost = await postRepo.findOne({
        where: { id },
        relations: ['original_post', 'original_post.root_post'],
      });

      if (!orginalPost) {
        throw new BadRequestException('Original post not found');
      }

      if (orginalPost.privacy === PostPrivacy.PRIVATE) {
        throw new BadRequestException('Cannot share a private post');
      } else if (orginalPost.privacy === PostPrivacy.FRIENDS_ONLY) {
        const isFriend = await this.friendshipRepository.exist({
          where: [
            {
              requester_id: orginalPost.author_id,
              addressee_id: userId,
              status: FriendshipStatus.ACCEPTED,
            },
            {
              requester_id: userId,
              addressee_id: orginalPost.author_id,
              status: FriendshipStatus.ACCEPTED,
            },
          ],
        });

        if (!isFriend) {
          throw new BadRequestException('Cannot share a friends-only post');
        }
      }

      const rootPost = orginalPost.root_post ?? orginalPost;

      const newPost = postRepo.create({
        author_id: userId,
        content: createPostDto.content?.trim() || '',
        privacy: createPostDto.privacy ?? PostPrivacy.PUBLIC,
        original_post_id: orginalPost.id,
        root_post_id: rootPost.id,
      });

      const savedPost = await postRepo.save(newPost);

      await postRepo.increment({ id: rootPost.id }, 'share_count', 1);

      let feedEntries: Feed[] = [];
      if (savedPost.privacy !== PostPrivacy.PRIVATE) {
        const friendIds = await this.friendshipRepository
          .createQueryBuilder('friendship')
          .select(
            'CASE WHEN friendship.requester_id = :authorId THEN friendship.addressee_id ELSE friendship.requester_id END',
            'friendId',
          )
          .where(
            'friendship.requester_id = :authorId OR friendship.addressee_id = :authorId',
            { authorId: userId },
          )
          .andWhere('friendship.status = :status', {
            status: FriendshipStatus.ACCEPTED,
          })
          .getRawMany();

        feedEntries = friendIds.map((f) => {
          return feedRepo.create({
            user_id: f.friendId,
            post_id: savedPost.id,
          });
        });
      }

      feedEntries.push(
        feedRepo.create({
          user_id: userId,
          post_id: savedPost.id,
        }),
      );

      await feedRepo.save(feedEntries);

      const result = await postRepo.findOne({
        where: { id: savedPost.id },
        relations: [
          'postMedias',
          'postMedias.media',
          'author',
          'original_post',
          'original_post.author',
        ],
      });

      return plainToInstance(PostResponseDto, result, {
        excludeExtraneousValues: true,
      });
    });
  }
}
