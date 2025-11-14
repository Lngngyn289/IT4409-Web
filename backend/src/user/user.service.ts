import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dtos/register.dto';
import { UserResponseBaseDto } from './dtos/user-response.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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
}
