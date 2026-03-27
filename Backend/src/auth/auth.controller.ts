import { Controller, Post, Get, Body, Patch, Param, Delete, UnauthorizedException, Req, UseGuards, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

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
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.authService.getUsers(parseInt(page), parseInt(limit));
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
        id: user.id,
        email: user.email,
        role: user.role,
        creditBalance: user.creditBalance
      }
    };
  }

  @Post('request-otp')
  async requestOtp(@Body() body: { email: string, name?: string, username?: string, password?: string }) {
    return this.authService.requestOtp(body.email, body.name, body.username, body.password);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string, code: string }) {
    const result = await this.authService.verifyOtp(body.email, body.code);
    
    const user = (result as any).user;
    if (!user) {
      return result; // For onboarding cases that need more info
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        creditBalance: user.creditBalance
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.authService.getUserById(req.user.id);
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return this.authService.updateUser(id, body);
  }

  @Delete('users/:id')
  async softDeleteUser(@Param('id') id: string) {
    return this.authService.softDeleteUser(id);
  }
  @Post('add-credits')
  async addCredits(@Body() body: { userId: string, credits: number }) {
    return this.authService.addCredits(body.userId, body.credits);
  }

  @Post('deduct-credits')
  async deductCredits(@Body() body: { userId: string, articleId: string }) {
    return this.authService.deductArticleCredit(body.userId, body.articleId);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string, password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
