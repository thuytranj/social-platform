import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth-guard';
import { CreateReactionDto } from '@/reactions/dto/create-reaction.dto';
import { ReactionsService } from '@/reactions/reactions.service';
import { ReactionTargetType } from '@/reactions/entities/reaction.entity';

@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService,
    private readonly reactionsService: ReactionsService
  ) {}

  @Post(':commentId/replies')
  replyToComment(
    @Req() req,
    @Param('commentId') commentId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.replyToComment(
      req.user.sub,
      commentId,
      createCommentDto,
    );
  }

  @Post(':commentId/reactions')
  reactToComment(
    @Req() req,
    @Param('commentId') commentId: string,
    @Body() createReactionDto: CreateReactionDto,
  ) {
    return this.reactionsService.create(
      req.user.sub,
      {
        ...createReactionDto,
        target_type: ReactionTargetType.COMMENT,
        target_id: commentId,
      }
    );
  }
    
  @Patch(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(req.user.sub, id, updateCommentDto);
  }

  @Patch(':id/reactions')
  updateReaction(
    @Req() req,
    @Param('id') id: string,
    @Body() createReactionDto: CreateReactionDto,
  ) {
    return this.reactionsService.update(req.user.sub, {
      ...createReactionDto,
      target_type: ReactionTargetType.COMMENT,
      target_id: id,
    });
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.commentsService.remove(req.user.sub, id);
  }

  @Delete(':commentId/reactions')
  removeReaction(
    @Req() req,
    @Param('commentId') commentId: string,
  ) {
    return this.reactionsService.remove(req.user.sub, commentId, ReactionTargetType.COMMENT);
  }
}
