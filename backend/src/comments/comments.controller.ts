import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth-guard';

@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':commentId/replies')
  replyToComment(@Req() req, @Param('commentId') commentId: string, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.replyToComment(req.user.sub, commentId, createCommentDto);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.update(req.user.sub, id, updateCommentDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.commentsService.remove(req.user.sub, id);
  }
}
