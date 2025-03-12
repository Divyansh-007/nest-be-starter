import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/decorators';
import { Prisma } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(private authService: UserService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMyInfo(@GetUser() user: any) {
    return user;
  }
}
