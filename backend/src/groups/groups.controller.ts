import { Body, Controller, Get, Param, Post, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth-guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { GroupMemberService } from './group-member.service';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService, private readonly groupMemberService: GroupMemberService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('coverFile', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  create(@Req() req, @Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto, req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOneById(id);
  }

  @Get(':groupId/members')
  findMembers(@Req() req, @Param('groupId') groupId: string, @Query('cursor') cursor?: string, @Query('limit') limit?: number) {
    return this.groupMemberService.findAllMembers(req.user.sub, groupId, limit, cursor);
  }
}
