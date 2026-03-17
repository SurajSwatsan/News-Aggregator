import { Controller, Post, Get, Body, Patch, Param, Delete, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register-superadmin')
  async registerSuperAdmin(@Body() body: any) {
    const user = await this.authService.registerSuperAdmin(body);
    return {
      message: 'SuperAdmin registered successfully',
      userId: user.id,
      email: user.email,
    };
  }

  @Post('register')
  async register(@Body() body: any) {
    return await this.authService.register(body);
  }

  @Get('admin-exists')
  async checkAdminExists() {
    return { exists: await this.authService.checkAdminExists() };
  }

  @Get('users')
  async getUsers() {
    return this.authService.getUsers();
  }

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        email: user.email,
        role: user.role,
        creditBalance: user.creditBalance
      }
    };
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return this.authService.updateUser(id, body);
  }

  @Delete('users/:id')
  async softDeleteUser(@Param('id') id: string) {
    return this.authService.softDeleteUser(id);
  }

  @Post('users/:id/restore')
  async restoreUser(@Param('id') id: string) {
    return this.authService.restoreUser(id);
  }
}
