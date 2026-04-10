import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth-guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CommentsService } from '@/comments/comments.service';
import { CreateCommentDto } from '@/comments/dto/create-comment.dto';
import { ReactionsService } from '@/reactions/reactions.service';
import { CreateReactionDto } from '@/reactions/dto/create-reaction.dto';
import { ReactionTargetType } from '@/reactions/entities/reaction.entity';


@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly reactionsService: ReactionsService,
  ) {}

  // Create a new post with optional media files
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (
          !file.mimetype.startsWith('image/') &&
          !file.mimetype.startsWith('video/')
        ) {
          return cb(new BadRequestException('Unsupported file type'), false);
        }
        cb(null, true);
      },
    }),
  )
  create(
    @Req() req,
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return this.postsService.create(req.user.sub, createPostDto, files);
  }

  // Share an existing post with optional additional content and media
  @Post('share/:id')
  sharePost(
    @Req() req,
    @Param('id') id: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.sharePost(req.user.sub, id, createPostDto);
  }

  // Add a comment to a post
  @Post(':id/comments')
  createComment(
    @Req() req,
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(req.user.sub, id, createCommentDto);
  }

  // Add a reaction to a post
  @Post(':postId/reactions')
  addReaction(
    @Req() req,
    @Param('postId') postId: string,
    @Body() createReactionDto: CreateReactionDto,
  ) {
    return this.reactionsService.create(req.user.sub, {
      ...createReactionDto,
      target_id: postId,
      target_type: ReactionTargetType.POST,
    });
  }

  // Get all root-level comments for a post with pagination
  @Get(':id/comments')
  findAllCommentsByPost(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.commentsService.findRootCommentsByPost(id, page, limit);
  }

  // Get all replies for a specific comment with pagination
  @Get(':postId/comments/:commentId/replies')
  findAllRepliesByComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.commentsService.findRepliesByComment(
      postId,
      commentId,
      page,
      limit,
    );
  }

  // Get the feed of posts for the authenticated user with pagination
  @Get('feeds')
  findAllUserFeeds(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.postsService.findAllUserFeeds(req.user.sub, page, limit);
  }

  // Get a single post by ID, including its details and associated media
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  // Update a post's content and/or media
  @Patch(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(req.user.sub, id, updatePostDto);
  }

  @Patch(':id/reactions')
  updateReaction(
    @Req() req,
    @Param('id') id: string,
    @Body() createReactionDto: CreateReactionDto,
  ) {
    return this.reactionsService.update(req.user.sub, {
      ...createReactionDto,
      target_id: id,
      target_type: ReactionTargetType.POST,
    });
  }

  // Delete a post
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.postsService.remove(req.user.sub, id);
  }

  // Detach a media file from a post
  @Delete(':postId/media/:mediaId')
  detachMediaFromPost(
    @Req() req,
    @Param('postId') postId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.postsService.detachMediaFromPost(req.user.sub, postId, mediaId);
  }

  @Delete(':postId/reactions')
  removeReaction(
    @Req() req,
    @Param('postId') postId: string,
  ) {
    return this.reactionsService.remove(req.user.sub, postId, ReactionTargetType.POST);
  }
}
