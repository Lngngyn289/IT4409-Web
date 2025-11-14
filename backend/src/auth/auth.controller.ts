import { Controller, Post, Body, Req } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthUserResponseDto } from '../user/dtos/user-response.dto';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { ApiTags, ApiResponse, ApiBody, ApiOperation } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, type: AuthUserResponseDto })
  async register(@Body() dto: RegisterDto): Promise<AuthUserResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: AuthUserResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthUserResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh-token')
  @Public()
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Returns new access and refresh tokens',
  })
  async refreshToken(@Body() body: { refreshToken: string }) {
    const { refreshToken } = body;
    if (!refreshToken)
      throw new BadRequestException('refreshToken is required');

    return this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    const userId = req.user.id;
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }
}
