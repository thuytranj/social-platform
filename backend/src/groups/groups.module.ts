import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupMemberService } from './group-member.service';
import { MediasModule } from '@/medias/medias.module';
import { User } from '@/users/entities/user.entity';
import { Post } from '@/posts/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember, User, Post]),
    MediasModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService, GroupMemberService],
  exports: [GroupsService, GroupMemberService],
})
export class GroupsModule {}
