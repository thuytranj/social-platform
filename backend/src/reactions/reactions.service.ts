import { BadRequestException, Injectable } from '@nestjs/common';
import { Reaction } from './entities/reaction.entity';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { ReactionTargetType } from './entities/reaction.entity';
import { DataSource } from 'typeorm';
import { Post } from '@/posts/entities/post.entity';
import { plainToInstance } from 'class-transformer';
import { ReactionResponseDto } from './dto/reaction-response.dto';
import { Comment } from '@/comments/entities/comment.entity';
import { User } from '@/users/entities/user.entity';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private reactionRepository: Repository<Reaction>,
    private readonly dataSource: DataSource,
  ) {}

  private getReactionRepository(manager?: EntityManager) {
    return manager?.getRepository(Reaction) ?? this.reactionRepository;
  }

  private executeTransaction<T>(
    manager: EntityManager | undefined,
    callback: (transactionManager: EntityManager) => Promise<T>,
  ) {
    return manager ? callback(manager) : this.dataSource.transaction(callback);
  }

  async create(
    userId: string,
    createReactionDto: CreateReactionDto,
    manager?: EntityManager,
  ) {
    return this.executeTransaction(manager, async (transactionManager) => {
      const userRepo = transactionManager.getRepository(User);
      const reactionRepo = this.getReactionRepository(transactionManager);
      const user = await userRepo.findOne({ where: { id: userId } });

      if (!user) {
        console.error(`User with ID ${userId} not found`);
        throw new BadRequestException('User not found');
      }

      if (createReactionDto.target_type === ReactionTargetType.POST) {
        const postRepo = transactionManager.getRepository(Post);

        const post = await postRepo.findOne({
          where: { id: createReactionDto.target_id },
        });

        if (!post) {
          throw new BadRequestException('Post not found');
        }

        const existingReaction = await reactionRepo.findOne({
          where: {
            author_id: userId,
            target_type: createReactionDto.target_type,
            target_id: createReactionDto.target_id,
          },
        });

        if (existingReaction) {
          throw new BadRequestException(
            'You have already reacted to this post',
          );
        }

        const reaction = await reactionRepo.create({
          target_type: createReactionDto.target_type,
          target_id: createReactionDto.target_id,
          type: createReactionDto.type,
          author: { id: userId },
        });

        await reactionRepo.save(reaction);

        await postRepo.increment(
          { id: createReactionDto.target_id },
          'react_count',
          1,
        );

        return plainToInstance(ReactionResponseDto, reaction, {
          excludeExtraneousValues: true,
        });
      } else if (createReactionDto.target_type === ReactionTargetType.COMMENT) {
        const commentRepo = transactionManager.getRepository(Comment);

        const comment = await commentRepo.findOne({
          where: { id: createReactionDto.target_id },
        });

        if (!comment) {
          throw new BadRequestException('Comment not found');
        }

        const existingReaction = await reactionRepo.findOne({
          where: {
            author_id: userId,
            target_type: createReactionDto.target_type,
            target_id: createReactionDto.target_id,
          },
        });

        if (existingReaction) {
          throw new BadRequestException(
            'You have already reacted to this comment',
          );
        }

        const reaction = await reactionRepo.create({
          target_type: createReactionDto.target_type,
          target_id: createReactionDto.target_id,
          type: createReactionDto.type,
          author: { id: userId },
        });

        await reactionRepo.save(reaction);
        await commentRepo.increment(
          { id: createReactionDto.target_id },
          'react_count',
          1,
        );

        return plainToInstance(ReactionResponseDto, reaction, {
          excludeExtraneousValues: true,
        });
      }
    });
  }

  async update(
    userId: string,
    createReactionDto: CreateReactionDto,
    manager?: EntityManager,
  ) {
    const reactionRepository = this.getReactionRepository(manager);
    const reaction = await reactionRepository.findOne({
      where: {
        author_id: userId,
        target_type: createReactionDto.target_type,
        target_id: createReactionDto.target_id,
      },
    });

    if (!reaction) {
      throw new BadRequestException('Reaction not found');
    }

    if (reaction.author_id !== userId) {
      throw new BadRequestException('You are not the author of this reaction');
    }

    reaction.type = createReactionDto.type;
    await reactionRepository.save(reaction);

    return plainToInstance(ReactionResponseDto, reaction, {
      excludeExtraneousValues: true,
    });
  }

  async remove(
    userId: string,
    target_id: string,
    target_type: ReactionTargetType,
    manager?: EntityManager,
  ) {
    return this.executeTransaction(manager, async (transactionManager) => {
      const reactionRepo = this.getReactionRepository(transactionManager);

      const reaction = await reactionRepo.findOne({
        where: {
          author_id: userId,
          target_type,
          target_id,
        },
      });

      if (!reaction) {
        throw new BadRequestException('Reaction not found');
      }

      if (reaction.author_id !== userId) {
        throw new BadRequestException(
          'You are not the author of this reaction',
        );
      }

      await reactionRepo.remove(reaction);

      if (target_type === ReactionTargetType.POST) {
        const postRepo = transactionManager.getRepository(Post);

        await postRepo.decrement({ id: target_id }, 'react_count', 1);
      } else if (target_type === ReactionTargetType.COMMENT) {
        const commentRepo = transactionManager.getRepository(Comment);

        await commentRepo.decrement({ id: target_id }, 'react_count', 1);
      }

      return { message: 'Reaction removed successfully' };
    });
  }
}
