import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ProfileDto } from './dto/profile.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { ParseUUIDPipe } from '@nestjs/common';
import { PostsService } from '@/posts/posts.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly postsService: PostsService) {}

  @Get('by-username')
  findOneByUsername(@Req() req, @Query('username') username: string) {
    return this.usersService.findOneByUsername(req.user.sub, username);
  }

  @Get('me')
  findMe(@Req() req) {
    return this.usersService.findOne(req.user.sub);
  }

  @Get(':id/post')
  findPostsByUserId(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.postsService.findPostsByUserId(req.user.sub, id, page, limit);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('profile')
  updateProfile(@Req() req, @Body() updateProfileDto: ProfileDto) {
    return this.usersService.updateProfile(req.user.sub, updateProfileDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
