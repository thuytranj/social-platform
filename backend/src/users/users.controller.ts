import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  Req,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ProfileDto } from './dto/profile.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { ParseUUIDPipe } from '@nestjs/common';
import { PostsService } from '@/posts/posts.service';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { memoryStorage } from 'multer';
import { FileFieldsInterceptor } from '@nestjs/platform-express/multer/interceptors/file-fields.interceptor';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  @Get('by-username')
  findOneByUsername(@Req() req, @Query('username') username: string) {
    return this.usersService.findOneByUsername(req.user.sub, username);
  }

  @Get('me')
  findMe(@Req() req) {
    return this.usersService.findOne(req.user.sub);
  }

  @Get(':id/post')
  findPostsByUserId(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit: number = 1,
    @Query('cursor') cursor?: string,
  ) {
    return this.postsService.findPostsByUserId(req.user.sub, id, limit, cursor);
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
  @UseInterceptors(
    FileFieldsInterceptor([
      {
        name: 'avatar',
        maxCount: 1,
      },
      {
        name: 'cover',
        maxCount: 1,
      }], {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Unsupported file type'), false);
        }
        cb(null, true);
      },
    }),
  )
  updateProfile(@Req() req, @Body() updateProfileDto: ProfileDto, @UploadedFiles() files: { avatar?: Express.Multer.File[], cover?: Express.Multer.File[] }) {
    const avatarFile = files.avatar?.[0];
    const coverFile = files.cover?.[0];

    return this.usersService.updateProfile(req.user.sub, updateProfileDto, avatarFile, coverFile);
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
