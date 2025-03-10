import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, SignupDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  private logger;
  constructor(private prisma: PrismaService) {
    this.logger = new Logger(AuthService.name, { timestamp: true });
  }

  async signup(dto: SignupDto) {
    try {
      const hash = await argon.hash(dto.password);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
          firstName: dto.firstName || dto.email.split('@')[0],
          lastName: dto.lastName || '',
        },
      });

      delete user.hash;

      return {
        message: 'User signed up successfully',
        data: user,
      };
    } catch (error) {
      this.logger.error(error.message);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Credentials taken');
        }
      }

      throw new BadRequestException('Unable to sign up');
    }
  }
  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const pwdMatched = await argon.verify(user.hash, dto.password);

      if (!pwdMatched) {
        throw new BadRequestException('Email or Password does not match');
      }

      delete user.hash;
      return {
        message: 'User logged in successfully',
        data: user,
      };
    } catch (error) {}
  }
}
