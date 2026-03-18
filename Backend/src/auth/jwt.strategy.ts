import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET || 'YourNextGenProjectSecretKey2026',
    });
  }

  async validate(payload: any) {
    // console.log('JwtStrategy validating payload:', payload);
    if (!payload.sub || !payload.role) {
      return null;
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
