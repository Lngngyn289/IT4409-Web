import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dtos/register.dto';
import { UserResponseBaseDto } from './dtos/user-response.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UploadService } from '../upload/upload.service';
import type { File as MulterFile } from 'multer';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async createUser(dto: RegisterDto): Promise<UserResponseBaseDto> {
    const {
      email,
      username,
      password,
      fullName,
      gender,
      dateOfBirth,
      avatarUrl,
    } = dto;

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) throw new ConflictException('Email hoặc username đã tồn tại');

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: passwordHash,
        fullName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        avatarUrl,
      },
    });

    return this.buildBaseUserResponse(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateRefreshToken(userId: string, refreshTokenHash: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: refreshTokenHash,
      },
    });
  }

  async getUserRoles(userId: string) {
    const wsRoles = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true, role: true },
    });

    const channelRoles = await this.prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true, role: true },
    });

    return { wsRoles, channelRoles };
  }

  buildBaseUserResponse(user): UserResponseBaseDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });

    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  /**
   * GET /api/users/me
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const { password, refreshToken, ...rest } = user;
    return rest;
  }

  /**  UPDATE AVATAR (S3) **/
  async updateAvatar(userId: string, file: MulterFile) {
    if (!file) throw new BadRequestException('Avatar file is required');

    const uploaded = await this.uploadService.uploadSingle(file, 'avatars');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: uploaded.url },
    });

    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  /**
   * PATCH /api/users/me/password
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    // Check old password
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('Old password is incorrect');

    // Validate confirmPassword
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }

    // Hash new password
    const hashed = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Password updated successfully' };
  }
}
