import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth-guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { GroupMemberService } from './group-member.service';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupRole } from './entities/group-member.entity';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupMemberService: GroupMemberService,
  ) {}

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
  create(@Req() req, @Body() createGroupDto: CreateGroupDto, @UploadedFile() coverFile: Express.Multer.File) {
    return this.groupsService.create(createGroupDto, req.user.sub, coverFile);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.groupsService.findOneById(id);
  }

  @Get(':groupId/members')
  findMembers(@Req() req, @Param('groupId', ParseUUIDPipe) groupId: string, @Query('cursor') cursor?: string, @Query('limit') limit?: number, @Query('role') role?: GroupRole) {
    return this.groupMemberService.findAllMembers(req.user.sub, groupId, limit, cursor, role);
  }

  @Get()
  findAllGroupsByUserId(@Req() req, @Query('cursor') cursor?: string, @Query('limit') limit?: number) {
    return this.groupsService.findAllGroupsByUserId(req.user.sub, limit, cursor);
  }

  @Patch(':id')
  update(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(req.user.sub, id, updateGroupDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.groupsService.remove(req.user.sub, id);
  }

  @Post(':id/join')
  joinGroup(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.groupMemberService.joinGroup(req.user.sub, id);  
  }

  @Delete(':id/leave')
  leaveGroup(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.groupMemberService.leaveGroup(req.user.sub, id);
  }

  @Patch(':id/transfer-ownership')
  transferOwnership(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Body('newOwnerId') newOwnerId: string) {
    return this.groupMemberService.transferOwnership(req.user.sub, id, newOwnerId);
  }

  @Get(':id/join-requests')
  findAllJoinRequests(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Query('cursor') cursor?: string, @Query('limit') limit?: number) {
    return this.groupMemberService.findAllJoinRequests(req.user.sub, id, limit, cursor);
  }

  @Post(':id/join-requests/:userId/approve')
  approveJoinRequest(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.groupMemberService.approveJoinRequest(req.user.sub, id, userId);
  }

  @Post(':id/join-requests/:userId/reject')
  rejectJoinRequest(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.groupMemberService.rejectJoinRequest(req.user.sub, id, userId);
  }

  @Get(':id/posts')
  findPostsByGroupId(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Query('cursor') cursor?: string, @Query('limit') limit?: number) {
    return this.groupsService.findPostsByGroupId(req.user.sub, id, limit, cursor);
  }

  @Patch(':id/add-admin')
  addAdmin(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Body('userId') userId: string) {
    return this.groupMemberService.addAdmin(req.user.sub, userId, id);
  }

  @Patch(':id/remove-admin')
  removeAdmin(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Body('userId') userId: string) {
    return this.groupMemberService.removeAdmin(req.user.sub, userId, id);
  }
}