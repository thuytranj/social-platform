import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { UsersModule } from '@/users/users.module';
import { GroupMemberService } from './group-member.service';
import { MediasModule } from '@/medias/medias.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember]),
    UsersModule,
    MediasModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService, GroupMemberService],
  exports: [GroupsService, GroupMemberService],
})
export class GroupsModule {}
