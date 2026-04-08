import { BadRequestException, Injectable} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { User } from '@/users/entities/user.entity';
import { Post } from '@/posts/entities/post.entity';
import { plainToInstance } from 'class-transformer';
import { CommentResponseDto } from './dto/comment-response.dto';

@Injectable()
export class CommentsService {
  constructor(@InjectRepository(Comment) private readonly commentsRepository: Repository<Comment>, private readonly dataSource: DataSource) { }
  
  async create(userId: string, postId: string, createCommentDto: CreateCommentDto) {
    return this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(Comment);
      const postRepo = manager.getRepository(Post);
      const userRepo = manager.getRepository(User);

      const post = await postRepo.findOne({ where: { id: postId } });
      if (!post) {
        throw new BadRequestException('Post not found');
      }

      const user = await userRepo.findOne({ where: { id: userId } });

      if (!user) {
        throw new BadRequestException('User not found');
      }
      
      const comment = commentRepo.create({
        content: createCommentDto.content,
        post: { id: postId },
        author: {id: userId },
      });

      await commentRepo.save(comment);

      await postRepo.increment({ id: postId }, 'comment_count', 1);

      return comment;
    })
  }

  buildCommentTree(comments: Comment[], parentId: string | null = null) {
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const comment of comments) {
      map.set(comment.id, {
        ...comment,
        replies: [],
      });
    }

    for (const comment of comments) {
      const node = map.get(comment.id);
      if (comment.parent_id) {
        const parent = map.get(comment.parent_id);
        if (parent) {
          parent.replies.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    const sortComments = (nodes: any[], isReply: boolean) => 
      nodes.sort((a, b) => {
        if (isReply) {
          return a.created_at.getTime() - b.created_at.getTime();
        } else {
          return b.created_at.getTime() - a.created_at.getTime();
        }
      }).map(node => ({ 
        ...node,
        replies: sortComments(node.replies, true)
      }));

    return sortComments(roots, false) || [];
  }

  async findAllCommentsByPost(postId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const comments = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.post_id = :postId', { postId })
      .skip(skip)
      .take(limit)
      .orderBy('comment.created_at', 'DESC')
      .getMany();
    
    const commentTree = this.buildCommentTree(comments);

    return commentTree.map(comment => plainToInstance(CommentResponseDto, comment, { excludeExtraneousValues: true }));
  }

  async replyToComment(userId: string, commentId: string, createCommentDto: CreateCommentDto) {
    return this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(Comment);
      const userRepo = manager.getRepository(User);
      const postRepo = manager.getRepository(Post);
      
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const parentComment = await commentRepo.findOne({ where: { id: commentId }, relations: ['post'] });

      if (!parentComment) {
        throw new BadRequestException('Parent comment not found');
      }

      const postId = parentComment.post.id;

      const comment = commentRepo.create({
        content: createCommentDto.content,
        author: { id: userId },
        post: { id: postId },
        parent: { id: commentId },
      });

      await commentRepo.save(comment);

      await postRepo.increment({ id: postId }, 'comment_count', 1);

      return comment;
    });
  }

  async update(userId: string, commentId: string, updateCommentDto: UpdateCommentDto) {
    const comment = await this.commentsRepository.findOne({ where: { id: commentId }, relations: ['author'] });
    
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

    await this.commentsRepository.save(comment);
    return {message: 'Comment updated successfully'};
  }

  async remove(userId: string, commentId: string) {
    const comment = await this.commentsRepository.findOne({ where: { id: commentId }, relations: ['author'] });

    if (!comment) {
      throw new BadRequestException('Comment not found');
    }

    if (comment.author.id !== userId) {
      throw new BadRequestException('You are not the author of this comment');
    }

    await this.commentsRepository.remove(comment);

    return {message: 'Comment removed successfully'};
  }
}
