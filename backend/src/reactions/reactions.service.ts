import { BadRequestException, Injectable } from '@nestjs/common';
import { Reaction } from './entities/reaction.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { ReactionTargetType } from './entities/reaction.entity';
import { DataSource } from 'typeorm';
import { Post } from '@/posts/entities/post.entity';
import { plainToInstance } from 'class-transformer';
import { ReactionResponseDto } from './dto/reaction-response.dto';
import { Comment } from '@/comments/entities/comment.entity';

@Injectable()
export class ReactionsService {
  constructor(@InjectRepository(Reaction) private reactionRepository: Repository<Reaction>, private readonly dataSource: DataSource) { }
  
  async create(userId: string, createReactionDto: CreateReactionDto) {
    return await this.dataSource.transaction(async manager => {
      const userRepo = manager.getRepository(Reaction);
      const reactionRepo = manager.getRepository(Reaction);
      const user = await userRepo.findOne({ where: { id: userId } });
      
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (createReactionDto.target_type === ReactionTargetType.POST) {
        const postRepo = manager.getRepository(Post);

        const post = await postRepo.findOne({ where: { id: createReactionDto.target_id } });

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
          author: { id: userId }
        })

        await reactionRepo.save(reaction);

        await postRepo.increment({ id: createReactionDto.target_id }, 'reaction_count', 1);

        return plainToInstance(ReactionResponseDto, reaction, { excludeExtraneousValues: true });
      } else if (createReactionDto.target_type === ReactionTargetType.COMMENT) {
        const commentRepo = manager.getRepository(Comment);

        const comment = await commentRepo.findOne({ where: { id: createReactionDto.target_id } });

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
        });

        await reactionRepo.save(reaction);
      }
    });
  }
}
