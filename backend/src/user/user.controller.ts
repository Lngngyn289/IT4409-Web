import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import type { File as MulterFile } from 'multer';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  // GET /api/users/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    return this.usersService.getMe(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  /** -----------------------------
   *  PATCH /api/users/me/avatar (update avatar via S3)
   * ----------------------------- */
  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async updateAvatar(@Req() req, @UploadedFile() file: MulterFile) {
    return this.usersService.updateAvatar(req.user.id, file);
  }

  // PATCH /api/users/me/change-password
  @UseGuards(JwtAuthGuard)
  @Patch('me/change-password')
  async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, dto);
  }
}
