import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from './ormconfig';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [ConfigModule.forRoot({isGlobal: true}), TypeOrmModule.forRoot(config), CommonModule, EmailModule, UsersModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
