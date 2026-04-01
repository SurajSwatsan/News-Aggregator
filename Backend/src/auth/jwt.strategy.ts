import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET || 'YourNextGenProjectSecretKey2026',
    });
  }

  async validate(payload: any) {
    if (!payload.sub || !payload.role) {
      return null;
    }

    // Check if user is soft-deleted
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { isDeleted: true }
    });

    if (!user || user.isDeleted) {
      throw new UnauthorizedException('This account has been deleted or is no longer active.');
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}

