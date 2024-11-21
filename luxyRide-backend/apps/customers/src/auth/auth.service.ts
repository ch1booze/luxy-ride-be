import { BadRequestException, Injectable } from '@nestjs/common';
import { SignupMethod } from 'apps/customers/prisma/client';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SignupDto, SignupResult } from './auth.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async generateAccessToken(dto: any) {
    const secret = this.configService.get<string>('CUSTOMERS_TOKEN_SECRET');
    return await this.jwtService.signAsync(dto, { secret, expiresIn: 30 });
  }

  async generateRefreshToken(dto: any) {
    const secret = this.configService.get<string>('CUSTOMERS_TOKEN_SECRET');
    return await this.jwtService.signAsync(dto, { secret, expiresIn: '7d' });
  }

  async signup(dto: SignupDto): Promise<SignupResult> {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException();
    }

    const passwordHash = await argon2.hash(dto.password, {
      secret: Buffer.from(
        this.configService.get<string>('CUSTOMERS_PASSWORD_SECRET'),
      ),
    });
    const createdUser = await this.prismaService.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        passwordHash,
        signupMethod: SignupMethod.EMAIL_PASSWORD,
      },
    });

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken({
        sub: createdUser.id,
        email: createdUser.email,
      }),
      this.generateRefreshToken({ sub: createdUser.id }),
    ]);

    return { accessToken, refreshToken };
  }
}
