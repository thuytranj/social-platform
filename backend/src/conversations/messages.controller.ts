import { Controller, Post, Body, Req, UseInterceptors, UploadedFiles, UseGuards } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { MessagesService } from "./messages.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth-guard";
import { ConversationGateway } from "./conversation.gateway";

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly conversationGateway: ConversationGateway
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      fileFilter: (
        req: any,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(
              'Invalid file type. Only images, PDF, and Word documents are allowed.',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10,
      },
    })
  )
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Req() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const savedMessage = await this.messagesService.createMessage(createMessageDto, req.user.sub, files);
    this.conversationGateway.server.to(createMessageDto.conversation_id).emit('new_message', savedMessage);
    
    return savedMessage;
  }
}