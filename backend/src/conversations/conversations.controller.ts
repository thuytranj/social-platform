import { BadRequestException, Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth-guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConversationMembersService } from './conversation-members.service';
import { MessagesService } from './messages.service';
import { FilesService } from '@/supabase/files.service';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly conversationMembersService: ConversationMembersService,
    private readonly messagesService: MessagesService,
    private readonly filesService: FilesService,
  ) {}

  @Post('group')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      if (
        !file.mimetype.startsWith('image/')
      ) {
        return cb(new BadRequestException('Unsupported file type'), false);
      }
      cb(null, true);
    },
  }))
  createGroupConversation(
    @Body() createConversationDto: CreateConversationDto,
    @Req() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.conversationsService.create(createConversationDto, req.user.sub, file);
  }

  @Post('private')
  createPrivateConversation(
    @Body() createConversationDto: CreateConversationDto,
    @Req() req,
  ) {
    return this.conversationsService.create(createConversationDto, req.user.sub);
  }

  @Post(':conversationId/members')
  addMember(
    @Param('conversationId') conversationId: string,
    @Body() body: {userId: string},
    @Req() req,
  ) {
    return this.conversationMembersService.addMember(conversationId, req.user.sub, body.userId);
  }

  @Delete(':conversationId/members/:memberId')
  removeMember(
    @Param('conversationId') conversationId: string,
    @Param('memberId') memberId: string,
    @Req() req,
  ) {
    return this.conversationMembersService.removeMember(conversationId, req.user.sub, memberId);
  }

  @Get(':conversationId/members')
  getConversationMembers(
    @Query('limit') limit: number = 20,
    @Query('cursor') cursor: string,
    @Param('conversationId') conversationId: string
  ) {
    return this.conversationMembersService.getMembers(conversationId, limit, cursor);
  }

  @Get(':conversationId/messages')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit: number = 20,
    @Query('cursor') cursor: string,
    @Req() req
  ) {
    return this.messagesService.getMessages(conversationId, req.user.sub, limit, cursor);
  }

  @Get(':conversationId/medias')
  getMedias(
    @Query('limit') limit: number = 20,
    @Query('cursor') cursor: string,
    @Param('conversationId') conversationId: string,
    @Req() req
  ) {
    return this.conversationsService.getConversationMedias(conversationId, req.user.sub, limit, cursor)
  }

  @Get(':conversationId/files') 
  getFiles(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit: number = 20,
    @Query('cursor') cursor: string,
    @Req() req
  ) {
    return this.filesService.getConversationFiles(conversationId, req.user.sub, limit, cursor)
  }

  @Get(':conversationId')
  getOne(
    @Param('conversationId') id: string,
    @Req() req
  ) {
    return this.conversationsService.getConversation(id, req.user.sub);
  }

  @Get()
  getConversations(
    @Query('limit') limit: number = 20,
    @Query('cursor') cursor: string,
    @Req() req
  ) {
    return this.conversationsService.getConversations(req.user.sub, limit, cursor);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      if (
        !file.mimetype.startsWith('image/')
      ) {
        return cb(new BadRequestException('Unsupported file type'), false);
      }
      cb(null, true);
    },
  }))
  update(
    @Param('conversationId') id: string, 
    @Body() updateConversationDto: UpdateConversationDto, 
    @Req() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.conversationsService.update(id, req.user.sub, updateConversationDto, file);
  }

  @Patch(':id/transfer-ownership')
  transferOwnership(
    @Param('id') conversationId: string,
    @Body() body: {userId: string},
    @Req() req,
  ) {
    return this.conversationMembersService.transferOwnership(conversationId, req.user.sub, body.userId);
  }

  @Delete(':id/leave')
  leaveConversation(
    @Param('id') id: string,
    @Req() req,
  ) {
    return this.conversationMembersService.leaveConversation(id, req.user.sub);
  }

  @Delete(':id')
  remove(
    @Param('id') conversationId: string,
    @Req() req,
  ) {
    return this.conversationsService.remove(req.user.sub, conversationId);
  }
}
