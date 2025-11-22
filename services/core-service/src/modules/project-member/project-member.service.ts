import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from './project-member.entity';
import { ProjectMemberListDto } from './dto/project-member-list.dto';
import { UserServiceProxy } from 'src/shared/user-service.proxy';

@Injectable()
export class ProjectMemberService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly memberRepo: Repository<ProjectMember>,
    private readonly userProxy: UserServiceProxy,
  ) {}

  /** ===================== CREATE ===================== */
  async create(dto: any) {
    const member = this.memberRepo.create(dto);
    return await this.memberRepo.save(member);
  }

  /** ===================== FIND ALL (with filter) ===================== */
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Lấy danh sách project_member + quan hệ project
    const [members, total] = await this.memberRepo.findAndCount({
      relations: ['project'],
      skip,
      take: limit,
      order: { id: 'DESC' },
    });

    // Gắn thêm thông tin user từ user-service
    const data: ProjectMemberListDto[] = [];

    for (const m of members) {
      const user = await this.userProxy.getUserById(m.user_id);

      data.push({
        id: m.id,
        projectName: m.project?.name ?? null,
        fullName: user.full_name,
        username: user.username,
        phoneNumber: user.phone_number,
        email: user.email,
        role: m.role,
        joinDate: m.created_at,
      });
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** ===================== FIND ONE ===================== */
  async findOne(id: number) {
    const member = await this.memberRepo.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!member) throw new NotFoundException('Project member not found');
    return member;
  }

  /** ===================== UPDATE ===================== */
  async update(id: number, dto: any) {
    const member = await this.findOne(id);
    Object.assign(member, dto);
    return await this.memberRepo.save(member);
  }

  /** ===================== DELETE ===================== */
  async remove(id: number) {
    const member = await this.findOne(id);
    return await this.memberRepo.remove(member);
  }

  /** ===================== GET ALL MEMBER IDs OF PROJECT ===================== */
  async getAllUserIds(projectId: number) {
    const list = await this.memberRepo.find({
      where: { project_id: projectId },
      select: ['user_id'],
    });

    return list.map((i) => i.user_id);
  }
}
