import { BadRequestException, Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth-guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConversationMembersService } from './conversation-members.service';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly conversationMembersService: ConversationMembersService
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

  @Get(':conversationId/members')
  getConversationMembers(
    @Query('limit') limit: number = 20,
    @Query('cursor') cursor: string,
    @Param('conversationId') conversationId: string
  ) {
    return this.conversationMembersService.getMembers(conversationId, limit, cursor);
  }

  @Get()
  getConversations(
    @Query('limit') limit: number = 20,
    @Query('cursor') cursor: string,
    @Req() req
  ) {
    return this.conversationsService.getConversations(req.user.sub, limit, cursor);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
    return this.conversationsService.update(+id, updateConversationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationsService.remove(+id);
  }
}
