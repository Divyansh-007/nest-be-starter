import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { GetUser } from 'src/decorators';
import { JwtGuard } from 'src/auth/guards';
import { User } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(private authService: UserService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  getMyInfo(@GetUser() user: User) {
    return user;
  }
}
