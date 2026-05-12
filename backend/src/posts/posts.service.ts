import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, Post as PostEntity, PostPrivacy } from './entities/post.entity';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
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
import {
  Reaction,
  ReactionTargetType,
} from '@/reactions/entities/reaction.entity';
import { Folder } from '@/common/constants/constants';
import { isDefined } from 'class-validator';

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

  private getPostRepository(manager?: EntityManager) {
    return manager?.getRepository(Post) ?? this.postsRepository;
  }

  private getFeedRepository(manager?: EntityManager) {
    return manager?.getRepository(Feed) ?? this.feedRepository;
  }

  private getFriendshipRepository(manager?: EntityManager) {
    return manager?.getRepository(Friendship) ?? this.friendshipRepository;
  }

  private executeTransaction<T>(
    manager: EntityManager | undefined,
    callback: (transactionManager: EntityManager) => Promise<T>,
  ) {
    return manager ? callback(manager) : this.dataSource.transaction(callback);
  }

  async create(
    authorId: string,
    createPostDto: CreatePostDto,
    files: Express.Multer.File[] = [],
    manager?: EntityManager,
  ) {
    if (!createPostDto.content && files.length === 0) {
      throw new BadRequestException('Post must have content or media');
    }

    const uploadMedias = await Promise.all(
      files.map((file) => {
        return this.cloudinaryService.uploadFile(file, Folder.POSTS);
      }),
    );

    try {
      return await this.executeTransaction(
        manager,
        async (transactionManager) => {
          const postRepo = this.getPostRepository(transactionManager);
          const postMediaRepo = transactionManager.getRepository(PostMedia);
          const feedRepo = this.getFeedRepository(transactionManager);
          const mediaRepo = transactionManager.getRepository(Media);
          const friendshipRepository =
            this.getFriendshipRepository(transactionManager);

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
            const friendIds = await friendshipRepository
              .createQueryBuilder('friendship')
              .select(
                'CASE WHEN friendship.requester_id = :authorId THEN friendship.addressee_id ELSE friendship.requester_id END',
                'friendId',
              )
              .where(
                '(friendship.requester_id = :authorId OR friendship.addressee_id = :authorId)',
                { authorId },
              )
              .andWhere('friendship.status = :status', {
                status: FriendshipStatus.ACCEPTED,
              })
              .getRawMany();
            console.log('Friend IDs for feed entries:', friendIds.map((f) => f.friendId));

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
        },
      );
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

  async findAllUserFeeds(
    userId: string,
    limit: number = 10,
    cursor?: string,
    manager?: EntityManager,
  ) {
    const feedRepository = this.getFeedRepository(manager);
    const postRepository = this.getPostRepository(manager);

    const idsQb = await feedRepository
      .createQueryBuilder('feed')
      .innerJoin('feed.post', 'post')
      .leftJoin('post.root_post', 'root')
      .select('post.id', 'id')
      .addSelect('feed.created_at', 'created_at')
      .addSelect('feed.id', 'feed_id')
      .where('feed.user_id = :userId', { userId })
      .andWhere(this.buildPrivacyCondition('post', 'root'), {
        viewerId: userId,
        public: PostPrivacy.PUBLIC,
        friends_only: PostPrivacy.FRIENDS_ONLY,
        private: PostPrivacy.PRIVATE,
        friendshipStatus: FriendshipStatus.ACCEPTED,
      })
      .orderBy('feed.created_at', 'DESC')
      .addOrderBy('feed.id', 'DESC') 
      .limit(limit + 1);
    
    if (cursor) {
      const { created_at, id } = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
      // console.log('Decoded cursor:', { created_at: new Date(created_at), id });
      idsQb.andWhere('feed.created_at < :created_at OR (feed.created_at = :created_at AND feed.id < :id)', { created_at: new Date(created_at), id });
    }

    const idsResult = await idsQb.getRawMany();
    let nextCursor: string | null = null;

    if (idsResult.length === 0) {
      return {
        data: [],
        nextCursor: null,
      };
    }

    if (idsResult.length > limit) {
      const lastEntry = idsResult.pop();
      console.log('Last entry for next cursor:', lastEntry);
      nextCursor = Buffer.from(JSON.stringify({ created_at: new Date(idsResult[limit-1].created_at).toISOString(), id: idsResult[limit-1].feed_id })).toString('base64');
    }

    // console.log('idsResult:', idsResult);

    const postIds = idsResult.map((row) => row.id);

    const posts = await postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.postMedias', 'pm')
      .leftJoinAndSelect('pm.media', 'media')
      .leftJoin('post.group', 'group')
      .addSelect(['group.id', 'group.name', 'group.cover_url'])
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.original_post', 'originalPost')
      .leftJoinAndSelect('originalPost.author', 'originalPostAuthor')
      .leftJoinAndSelect('post.root_post', 'root')
      .leftJoinAndSelect('root.author', 'rootAuthor')
      .where('post.id IN (:...postIds)', { postIds })
      .orderBy(`array_position(ARRAY[:...postIds]::uuid[], post.id)`)
      .getMany();

    // Transform the posts to PostResponseDto
    const data = posts.map((post) => ({
      ...plainToInstance(PostResponseDto, post, {
        excludeExtraneousValues: true,
      }),
      group_name: post.group?.name ?? null,
      group_cover_url: post.group?.cover_url ?? null,
    }));
    
    return {
      data,
      nextCursor,
    };
  }

  async findOne(id: string, manager?: EntityManager) {
    const postRepository = this.getPostRepository(manager);
    const result = await postRepository.findOne({
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
    limit: number = 10,
    cursor?: string,
    manager?: EntityManager,
  ) {
    const friendshipRepository = this.getFriendshipRepository(manager);
    const isBlocked = await friendshipRepository.exist({
      where: [
        { requester_id: actorId, addressee_id: userId, status: FriendshipStatus.BLOCKED },
        { requester_id: userId, addressee_id: actorId, status: FriendshipStatus.BLOCKED },
      ],
    });

    if (isBlocked) {
      throw new BadRequestException('You cannot view posts of this user');
    }

    const postRepository = this.getPostRepository(manager);

    const qb = postRepository
      .createQueryBuilder('post')
      .leftJoin('post.root_post', 'root')
      .select('post.id', 'id')
      .addSelect('post.created_at', 'created_at')
      .where('post.author_id = :userId', { userId })
      .andWhere(this.buildPrivacyCondition('post', 'root'), {
        viewerId: actorId,
        public: PostPrivacy.PUBLIC,
        friends_only: PostPrivacy.FRIENDS_ONLY,
        private: PostPrivacy.PRIVATE,
        friendshipStatus: FriendshipStatus.ACCEPTED,
      })
      .orderBy('post.created_at', 'DESC')
      .addOrderBy('post.id', 'DESC')
      .distinctOn(['post.id', 'post.created_at'])
      .limit(limit + 1);
    
    if (cursor) {
      const { created_at, id } = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
      qb.andWhere('post.created_at < :created_at OR (post.created_at = :created_at AND post.id < :id)', { created_at: new Date(created_at), id });
    }

    const qbResult = await qb.getRawMany();
    let nextCursor: string | null = null;

    if (qbResult.length === 0) {
      return {
        data: [],
        nextCursor: null,
      };
    }

    if (qbResult.length > limit) {
      const lastPost = qbResult.pop();
      nextCursor = Buffer.from(JSON.stringify({ created_at: new Date(qbResult[limit-1].created_at).toISOString(), id: qbResult[limit-1].id })).toString('base64');
    }

    const postIds = qbResult.map((p) => p.id);
    
    const posts = await postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.postMedias', 'pm')
      .leftJoinAndSelect('pm.media', 'media')
      .leftJoin('post.group', 'group')
      .addSelect(['group.id', 'group.name', 'group.cover_url'])
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.original_post', 'originalPost')
      .leftJoinAndSelect('originalPost.author', 'originalPostAuthor')
      .leftJoinAndSelect('post.root_post', 'root')
      .leftJoinAndSelect('root.author', 'rootAuthor')
      .where('post.id IN (:...postIds)', { postIds })
      .orderBy(`array_position(ARRAY[:...postIds]::uuid[], post.id)`)
      .getMany();

    return {
      data: posts.map((post) =>
        ({...plainToInstance(PostResponseDto, post, {
          excludeExtraneousValues: true,
        }), group_name: post.group?.name ?? null, group_cover_url: post.group?.cover_url ?? null})
      ),
      nextCursor,
    };
  }

  async update(
    userId: string,
    id: string,
    updatePostDto: UpdatePostDto,
    manager?: EntityManager,
  ) {
    const postRepository = this.getPostRepository(manager);
    const post = await postRepository.findOne({ where: { id } });
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
    return plainToInstance(PostResponseDto, await postRepository.save(post), {
      excludeExtraneousValues: true,
    });
  }

  async sharePost(
    userId: string,
    id: string,
    createPostDto: CreatePostDto,
    manager?: EntityManager,
  ) {
    return this.executeTransaction(manager, async (transactionManager) => {
      const postRepo = this.getPostRepository(transactionManager);
      const feedRepo = this.getFeedRepository(transactionManager);
      const friendshipRepository =
        this.getFriendshipRepository(transactionManager);

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
        const isFriend = await friendshipRepository.exist({
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
        const friendIds = await friendshipRepository
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

  async remove(userId: string, id: string, manager?: EntityManager) {
    return this.executeTransaction(manager, async (transactionManager) => {
      const postRepo = this.getPostRepository(transactionManager);
      const mediaRepo = transactionManager.getRepository(Media);

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

      await postRepo.decrement({ id: post.root_post?.id }, 'react_count', 1);

      if (post.react_count > 0) {
        const reactionRepo = transactionManager.getRepository(Reaction);

        await reactionRepo.delete({
          target_type: ReactionTargetType.POST,
          target_id: post.id,
        });
      }

      return { message: 'Post deleted successfully' };
    });
  }

  async detachMediaFromPost(
    userId: string,
    postId: string,
    mediaId: string,
    manager?: EntityManager,
  ) {
    return this.executeTransaction(manager, async (transactionManager) => {
      const postMediaRepo = transactionManager.getRepository(PostMedia);
      const mediaRepo = transactionManager.getRepository(Media);

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
}
