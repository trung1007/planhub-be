// auth.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { LoginDto } from './dto/login.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async validateUser(
    password: string,
    username?: string,
    email?: string,
  ): Promise<User | null> {
    let user: User | null = null;

    if (email) {
      user = await this.userRepo.findOne({ where: { email } });
    } else if (username) {
      user = await this.userRepo.findOne({ where: { username } });
    }

    if (!user) return null;

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) return null;

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.password, dto.username, dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    const refresh_token = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '3d' },
    );

    await this.userRepo.update(user.id, { refreshToken: refresh_token });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      access_token,
      refresh_token,
    };
  }
  async register(dto: RegisterDto): Promise<User> {
    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Tạo user mới với mật khẩu đã hash
    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
    });

    return this.userRepo.save(user);
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token đã hết hạn');
      }

      if (err.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      throw new UnauthorizedException('Không thể xác thực refresh token');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    // Kiểm tra refreshToken có khớp DB không
    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token không trùng khớp');
    }

    // Tạo Access Token mới
    const newAccessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
      },
      { expiresIn: '24h' },
    );

    return {
      access_token: newAccessToken,
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    // Verify refresh token để lấy payload.sub (id user)
    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch (err) {
      // Không quan trọng expired hay invalid, chỉ cần không cho logout nếu token không hợp lệ
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    // Kiểm tra refresh token trong DB
    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token không trùng khớp');
    }

    // 🔥 Xoá refresh token trong DB
    await this.userRepo.update(user.id, { refreshToken: null });

    return {
      message: 'Logout thành công',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Email not found');
    }

    // Tạo token chứa userId, không lưu DB
    const token = this.jwtService.sign(
      { userId: user.id },
      { expiresIn: '15m' },
    );

    const resetLink = `http://localhost:3000/forgot-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Your Password',
      html: `
        <h3>Reset your password</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <br/><br/>
        <p>This link will expire in 15 minutes.</p>
      `,
    });

    return { message: 'Reset link sent to email' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<User> {
    const decoded = this.jwtService.verify(dto.token);
    if (!decoded || !decoded.userId) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }
    const user = await this.userRepo.findOne({ where: { id: decoded.userId } });
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashedPassword;
    return this.userRepo.save(user);
  }
}
