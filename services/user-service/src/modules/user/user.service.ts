import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Tạo user mới với mật khẩu đã hash
    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
    });

    return this.userRepo.save(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.username && dto.username !== user.username) {
      const existedUsername = await this.userRepo.findOne({
        where: { username: dto.username },
      });

      if (existedUsername && existedUsername.id !== user.id) {
        throw new BadRequestException('Username đã được sử dụng');
      }
    }

    if (dto.email && dto.email !== user.email) {
      const existedEmail = await this.userRepo.findOne({
        where: { email: dto.email },
      });

      if (existedEmail && existedEmail.id !== user.id) {
        throw new BadRequestException('Email đã được sử dụng');
      }
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<User> {
    const user = await this.findOne(id);

    // 1. Kiểm tra mật khẩu hiện tại có đúng không
    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    // (Optional) Không cho dùng lại mật khẩu cũ
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    // 2. Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashedPassword;

    // 3. Lưu lại user
    return this.userRepo.save(user);
  }


  async remove(id: number) {
    const found = await this.findOne(id);
    return this.userRepo.remove(found);
  }
}
