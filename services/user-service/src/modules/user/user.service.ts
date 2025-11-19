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
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // async findAll(): Promise<User[]> {
  //   return this.userRepo.find();
  // }

  async findAll(page = 1, limit = 10) {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Number(limit) || 10);

    const [users, total] = await this.userRepo.findAndCount({
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      order: { id: 'ASC' },
    });

    const items = await Promise.all(
      users.map((u) => this.mapUserToResponseDto(u)),
    );

    return {
      items,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const createdUser = await this.userRepo.findOne({
      where: { id: dto.createdUserId },
    });
    if (!createdUser)
      throw new NotFoundException(`User ${dto.createdUserId} not found`);

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Tạo user mới với mật khẩu đã hash
    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
    });

    user.createdBy = dto.createdUserId;

    return this.userRepo.save(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userRepo.findOne({
      where: { id: dto.updatedUserId },
    });
    if (!updatedUser)
      throw new NotFoundException(`User ${dto.updatedUserId} not found`);

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
    user.updatedBy = dto.updatedUserId;
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

  private async mapUserToResponseDto(u: User): Promise<UserResponseDto> {
    const createdByUsername = u.createdBy
      ? (await this.userRepo.findOne({ where: { id: u.createdBy } }))
          ?.username || ''
      : '';

    const updatedByUsername = u.updatedBy
      ? (await this.userRepo.findOne({ where: { id: u.updatedBy } }))
          ?.username || ''
      : '';

    // Dùng Object.assign để merge nhanh
    return Object.assign(new UserResponseDto(), {
      id: u.id,
      username: u.username,
      email: u.email,
      phoneNumber: u.phoneNumber,
      fullName: u.fullName,
      createdBy: createdByUsername,
      createdAt: u.createdAt,
      updatedBy: updatedByUsername,
      updatedAt: u.updatedAt,
    });
  }
}
