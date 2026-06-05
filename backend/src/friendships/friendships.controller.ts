import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Delete,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { CreateFriendshipDto } from './dto/creat-friendship.dto';
import { Req } from '@nestjs/common';
import { ConfirmFriendshipDto } from './dto/confirm-friendship-dto';
import { BlockUserDto } from './dto/block-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Post()
  create(@Req() req, @Body() createFriendshipDto: CreateFriendshipDto) {
    return this.friendshipsService.create(req.user.sub, createFriendshipDto);
  }

  @Post('/confirm')
  confirmRequest(
    @Req() req,
    @Body() confirmFriendshipDto: ConfirmFriendshipDto,
  ) {
    return this.friendshipsService.confirmRequest(
      req.user.sub,
      confirmFriendshipDto,
    );
  }

  @Delete('/cancel-request')
  cancelRequest(@Req() req, @Body('addressee_id') addresseeId: string) {
    return this.friendshipsService.cancelRequest(req.user.sub, addresseeId);
  }

  @Get('/sent-requests')
  getSentRequests(@Req() req, @Query('cursor') cursor: string, @Query('limit') limit: number = 10) {
    return this.friendshipsService.getSentRequests(req.user.sub, limit, cursor);
  }

  @Get('/received-requests')
  getReceivedRequests(@Req() req, @Query('cursor') cursor: string, @Query('limit') limit: number = 10) {
    return this.friendshipsService.getReceivedRequests(req.user.sub, limit, cursor);
  }

  @Get('/friends')
  getFriends(@Req() req, @Query('cursor') cursor: string, @Query('limit') limit: number = 10) {
    return this.friendshipsService.getFriends(req.user.sub, limit, cursor);
  }

  @Get('/blocked-users')
  getBlockedUsers(@Req() req, @Query('cursor') cursor: string, @Query('limit') limit: number = 10) {
    return this.friendshipsService.getBlockedUsers(req.user.sub, limit, cursor);
  }

  @Get('/mutual-friends')
  getMutualFriends(@Req() req, @Query('cursor') cursor: string, @Query('limit') limit: number = 10, @Body('otherUserId') otherUserId: string) {
    return this.friendshipsService.getMutualFriends(req.user.sub, otherUserId, limit, cursor);
  }

  @Patch('/block')
  blockUser(@Req() req, @Body() body: BlockUserDto) {
    return this.friendshipsService.blockUser(req.user.sub, body.blockUserId);
  }

  @Delete('/unblock')
  unblockUser(@Req() req, @Body() body: BlockUserDto) {
    return this.friendshipsService.unblockUser(req.user.sub, body.blockUserId);
  }

  @Delete(':friendId/remove-friend')
  removeFriend(@Req() req, @Param('friendId') friendId: string) {
    return this.friendshipsService.removeFriend(req.user.sub, friendId);
  }
}
