import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from '@/posts/entities/post.entity';
import { plainToInstance } from 'class-transformer';
import { CommentResponseDto } from './dto/comment-response.dto';
import {
  Reaction,
  ReactionTargetType,
} from '@/reactions/entities/reaction.entity';
import { User } from '@/users/entities/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    private readonly dataSource: DataSource,
  ) {}

  private getCommentRepository(manager?: EntityManager) {
    return manager?.getRepository(Comment) ?? this.commentsRepository;
  }

  private executeTransaction<T>(
    manager: EntityManager | undefined,
    callback: (transactionManager: EntityManager) => Promise<T>,
  ) {
    return manager ? callback(manager) : this.dataSource.transaction(callback);
  }

  async create(
    userId: string,
    postId: string,
    createCommentDto: CreateCommentDto,
    parentId?: string,
    manager?: EntityManager,
  ) {
    return this.executeTransaction(manager, async (transactionManager) => {
      const commentRepo = this.getCommentRepository(transactionManager);
      const postRepo = transactionManager.getRepository(Post);
      const userRepo = transactionManager.getRepository(User);

      const post = await postRepo.findOne({ where: { id: postId } });
      if (!post) {
        throw new BadRequestException('Post not found');
      }

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (parentId) {
        const parentComment = await this.findOne(parentId, transactionManager);

        if (!parentComment) {
          throw new BadRequestException('Parent comment not found');
        }

        if (parentComment.post.id !== postId) {
          throw new BadRequestException('Parent comment does not belong to the same post');
        }
      }

      const comment = commentRepo.create({
        content: createCommentDto.content,
        post: { id: postId },
        author: { id: userId },
        parent: parentId ? { id: parentId } : undefined,
      });

      await commentRepo.save(comment);

      await postRepo.increment({ id: postId }, 'comment_count', 1);

      return comment;
    });
  }

  async findRootCommentsByPost(
    postId: string,
    page: number = 1,
    limit: number = 10,
    manager?: EntityManager,
  ) {
    const skip = (page - 1) * limit;
    const commentRepo = this.getCommentRepository(manager);

    const qb = commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoin(
        (qb) =>
          qb
            .select('c.parent_id', 'parent_id')
            .addSelect('COUNT(*)', 'replies_count')
            .from(Comment, 'c')
            .where('c.post_id = :postId', { postId })
            .groupBy('c.parent_id'),
        'replies',
        'replies.parent_id = comment.id',
      )
      .addSelect('COALESCE(replies.replies_count, 0)', 'replies_count')
      .where('comment.post_id = :postId', { postId })
      .andWhere('comment.parent_id IS NULL')
      .orderBy('comment.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const { raw, entities } = await qb.getRawAndEntities();

    const rawMap = new Map(
      raw.map((item) => [item.comment_id, item.replies_count]),
    );

    const total = await commentRepo
      .createQueryBuilder('comment')
      .where('comment.post_id = :postId', { postId })
      .andWhere('comment.parent_id IS NULL')
      .getCount();

    const data = plainToInstance(
      CommentResponseDto,
      entities.map((entity) => ({
        ...entity,
        replies_count: Number(rawMap.get(entity.id) || 0),
      })),
      { excludeExtraneousValues: true },
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

  findOne(id: string, manager?: EntityManager) {
    const commentRepo = this.getCommentRepository(manager);
    return commentRepo.findOne({
      where: { id },
      relations: ['post'],
    });
  }

  async findRepliesByComment(
    postId: string,
    commentId: string,
    page: number = 1,
    limit: number = 10,
    manager?: EntityManager,
  ) {
    const skip = (page - 1) * limit;
    const commentRepo = this.getCommentRepository(manager);

    const qb = commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoin(
        (qb) =>
          qb
            .select('c.parent_id', 'parent_id')
            .addSelect('COUNT(*)', 'replies_count')
            .from(Comment, 'c')
            .where('c.post_id = :postId', { postId })
            .groupBy('c.parent_id'),
        'replies',
        'replies.parent_id = comment.id',
      )
      .addSelect('COALESCE(replies.replies_count, 0)', 'replies_count')
      .where('comment.parent_id = :commentId', { commentId })
      .skip(skip)
      .take(limit)
      .orderBy('comment.created_at', 'ASC');

    const { raw, entities } = await qb.getRawAndEntities();

    const rawMap = new Map(
      raw.map((item) => [item.comment_id, item.replies_count]),
    );

    const total = await commentRepo
      .createQueryBuilder('comment')
      .where('comment.parent_id = :commentId', { commentId })
      .getCount();

    const data = plainToInstance(
      CommentResponseDto,
      entities.map((entity) => ({
        ...entity,
        replies_count: Number(rawMap.get(entity.id) || 0),
      })),
      { excludeExtraneousValues: true },
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

  async replyToComment(
    userId: string,
    commentId: string,
    createCommentDto: CreateCommentDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const parentComment = await this.findOne(commentId, manager);

      if (!parentComment) {
        throw new BadRequestException('Parent comment not found');
      }

      const postId = parentComment.post.id;

      const comment = this.create(userId, postId, createCommentDto, parentComment.id, manager);
      return comment;
    });
  }

  async update(
    userId: string,
    commentId: string,
    updateCommentDto: UpdateCommentDto,
    manager?: EntityManager,
  ) {
    const commentRepo = this.getCommentRepository(manager);
    const comment = await commentRepo.findOne({
      where: { id: commentId },
      relations: ['author'],
    });

    if (!comment) {
      throw new BadRequestException('Comment not found');
    }

    if (comment.author.id !== userId) {
      throw new BadRequestException('You are not the author of this comment');
    }

    Object.assign(comment, {
      ...comment,
      content: updateCommentDto.content,
    });

    await commentRepo.save(comment);
    return { message: 'Comment updated successfully' };
  }

  async remove(userId: string, commentId: string, manager?: EntityManager) {
    return this.executeTransaction(manager, async (transactionManager) => {
      const commentRepo = this.getCommentRepository(transactionManager);
      const postRepo = transactionManager.getRepository(Post);

      const comment = await commentRepo.findOne({
        where: { id: commentId },
        relations: ['author', 'post'],
      });

      if (!comment) {
        throw new BadRequestException('Comment not found');
      }

      if (comment.author.id !== userId) {
        throw new BadRequestException('You are not the author of this comment');
      }

      await commentRepo.remove(comment);

      await postRepo.decrement({ id: comment.post.id }, 'comment_count', 1);

      if (comment.react_count > 0) {
        const reactionRepo = transactionManager.getRepository(Reaction);

        await reactionRepo.delete({
          target_type: ReactionTargetType.COMMENT,
          target_id: comment.id,
        });
      }

      return { message: 'Comment deleted successfully' };
    });
  }
}
