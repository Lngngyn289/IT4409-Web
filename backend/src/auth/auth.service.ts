import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JwtPayload } from '../common/types/jwt-payload.interface';
import {
  UserResponseBaseDto,
  AuthUserResponseDto,
} from '../user/dtos/user-response.dto';

@Injectable()
export class AuthService {
  private ACCESS_TTL = 15 * 60;
  private REFRESH_TTL = 7 * 24 * 60 * 60;
  private REFRESH_HASH_SALT_ROUNDS = 10;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private signAccessToken(payload: JwtPayload) {
    return this.jwtService.sign(payload, { expiresIn: this.ACCESS_TTL });
  }

  private signRefreshToken(payload: JwtPayload) {
    return this.jwtService.sign(payload, { expiresIn: this.REFRESH_TTL });
  }

  private async saveHashedRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, this.REFRESH_HASH_SALT_ROUNDS);
    await this.userService.updateRefreshToken(userId, hash);
  }

  private async buildJwtPayload(
    userId: string,
    email: string,
  ): Promise<JwtPayload> {
    const { wsRoles, channelRoles } =
      await this.userService.getUserRoles(userId);

    const payload: JwtPayload = {
      id: userId,
      email,
      rolesByWorkspace: wsRoles ?? [],
      rolesByChannel: channelRoles ?? [],
    };

    return payload;
  }

  // REGISTER
  async register(dto: RegisterDto): Promise<AuthUserResponseDto> {
    const user: UserResponseBaseDto = await this.userService.createUser(dto);

    const payload = await this.buildJwtPayload(user.id, user.email);
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    await this.saveHashedRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  // LOGIN
  async login(dto: LoginDto): Promise<AuthUserResponseDto> {
    const userRecord = await this.userService.findByEmail(dto.email);
    if (!userRecord) throw new UnauthorizedException('Email not found');

    const match = await bcrypt.compare(dto.password, userRecord.password);
    if (!match) throw new UnauthorizedException('Wrong password');

    const payload = await this.buildJwtPayload(userRecord.id, userRecord.email);
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    await this.saveHashedRefreshToken(userRecord.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: this.userService.buildBaseUserResponse(userRecord),
    };
  }

  // Logout / revoke refresh token
  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
  }

  // REFRESH - verify provided refreshToken, return new tokens (rotate)
  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken)
      throw new BadRequestException('refreshToken is required');

    let decoded: JwtPayload;
    try {
      decoded = this.jwtService.verify<JwtPayload>(refreshToken);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // find user by decoded.id
    const user = await this.userService.findById(decoded.id);
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Invalid refresh token');

    // compare hash stored with provided token
    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) throw new UnauthorizedException('Invalid refresh token');

    // rebuild payload from DB to get updated roles
    const payload = await this.buildJwtPayload(user.id, user.email);

    // sign new tokens (rotate refresh token)
    const newAccessToken = this.signAccessToken(payload);
    const newRefreshToken = this.signRefreshToken(payload);

    // store hash of new refresh token
    await this.saveHashedRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
