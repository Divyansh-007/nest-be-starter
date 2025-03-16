import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, RefreshAccessDto, SignupDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private logger;
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.logger = new Logger(AuthService.name, { timestamp: true });
  }

  signToken(userId: string, email: string) {
    const payload = {
      sub: userId,
      email,
    };

    const secret = this.configService.get('JWT_SECRET');

    const access_token = this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });

    const refresh_token = this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: secret,
    });

    return {
      access_token,
      refresh_token,
    };
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

      return {
        message: 'User signed up successfully',
        data: this.signToken(user.id, user.email),
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

      return {
        message: 'User logged in successfully',
        data: this.signToken(user.id, user.email),
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException('Unable to login');
    }
  }

  async refreshToken(dto: RefreshAccessDto) {
    try {
      const decoded = this.jwtService.verify(dto.refresh_token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: {
          id: decoded.sub,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        message: 'Access token refreshed successfully',
        data: this.signToken(user.id, user.email),
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException('Unable to refresh token');
    }
  }
}
