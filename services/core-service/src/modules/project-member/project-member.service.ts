import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from './project-member.entity';
import { ProjectMemberListDto } from './dto/project-member-list.dto';
import { UserServiceProxy } from 'src/shared/user-service.proxy';
import { ActionProjectMemberDto } from './dto/create-project-member.dto';

@Injectable()
export class ProjectMemberService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly memberRepo: Repository<ProjectMember>,
    private readonly userProxy: UserServiceProxy,
  ) {}

  /** ===================== CREATE ===================== */

  async create(dto: ActionProjectMemberDto) {
    const exists = await this.memberRepo.findOne({
      where: {
        project_id: dto.projectId,
        user_id: dto.userId,
        role_id: dto.roleId,
      },
      relations: ['project'],
    });

    if (exists) {
      const [user, role] = await Promise.all([
        this.userProxy.getUserById(dto.userId).catch(() => null),
        this.userProxy.getRoleById(dto.roleId).catch(() => null),
      ]);

      const projectName = exists.project?.name ?? `Project ${dto.projectId}`;
      // const userName = user?.fullName || user?.username || `User ${dto.userId}`;
      const roleName = role?.key || `Role ${dto.roleId}`;

      throw new BadRequestException(
        `This user already has role "${roleName}" in project "${projectName}"`,
      );
    }

    const [day, month, year] = dto.joinDate.split('-');
    const joinDate = new Date(Number(year), Number(month) - 1, Number(day));

    if (isNaN(joinDate.getTime())) {
      throw new BadRequestException(
        'Invalid joinDate format. Expect DD-MM-YYYY.',
      );
    }

    const member = this.memberRepo.create({
      project_id: dto.projectId,
      user_id: dto.userId,
      role_id: dto.roleId,
      join_date: joinDate,
      created_by: dto.createdId,
    });

    return await this.memberRepo.save(member);
  }

  async getRoleByUserId(userId: number) {
    return await this.memberRepo.find({
      where: { user_id: userId },
      select: ['id', 'project_id', 'role_id'],
    });
  }

  /** ===================== FIND ALL (with filter) ===================== */
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Lấy danh sách project_member + quan hệ project
    const [members, total] = await this.memberRepo.findAndCount({
      relations: ['project'],
      skip,
      take: limit,
      order: { project_id: 'ASC' },
    });

    // Gắn thêm thông tin user từ user-service
    const items: ProjectMemberListDto[] = [];

    for (const m of members) {
      const [user, role, createdUser] = await Promise.all([
        this.userProxy.getUserById(m.user_id).catch(() => null),
        this.userProxy.getRoleById(m.role_id).catch(() => null),
        this.userProxy.getUserById(m.created_by).catch(() => null),
      ]);

      items.push({
        id: m.id,
        projectName: m.project?.name ?? null,
        projectId: m.project_id,

        fullName: user?.fullName ?? null,
        username: user?.username ?? null,
        userId: m?.user_id ?? null,
        phoneNumber: user?.phoneNumber ?? null,
        email: user?.email ?? null,

        role: role?.key ?? null,
        roleId: m.role_id ?? null,

        joinDate: m.join_date,

        createdBy: createdUser?.username ?? null,
      });
    }

    return {
      items,
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

  async update(id: number, dto: ActionProjectMemberDto) {
    // ========================= Validate join date =========================
    const [day, month, year] = dto.joinDate.split('-');
    const joinDate = new Date(Number(year), Number(month) - 1, Number(day));

    if (isNaN(joinDate.getTime())) {
      throw new BadRequestException(
        'Invalid joinDate format. Expect DD-MM-YYYY.',
      );
    }

    // ========================= Find existing member =========================
    const member = await this.findOne(id);

    // ========================= Check uniqueness before update =========================
    const duplicate = await this.memberRepo.findOne({
      where: {
        project_id: dto.projectId,
        user_id: dto.userId,
        role_id: dto.roleId,
      },
      relations: ['project'],
    });

    // Nếu tìm thấy duplicate và nó KHÔNG PHẢI LÀ chính bản ghi đang update
    if (duplicate && duplicate.id !== id) {
      const [user, role] = await Promise.all([
        this.userProxy.getUserById(dto.userId).catch(() => null),
        this.userProxy.getRoleById(dto.roleId).catch(() => null),
      ]);

      const projectName = duplicate.project?.name ?? `Project ${dto.projectId}`;
      const userName = user?.fullName || user?.username || `User ${dto.userId}`;
      const roleName = role?.key || `Role ${dto.roleId}`;

      throw new BadRequestException(
        `Member already exists: ${userName} already has role "${roleName}" in project "${projectName}".`,
      );
    }
    member.project_id = dto.projectId;
    member.user_id = dto.userId;
    member.role_id = dto.roleId;
    member.created_by = dto.createdId;
    member.join_date = joinDate;

    // ========================= Save =========================
    return await this.memberRepo.save(member);
  }

  async removeByProject(projectId: number) {
    const members = await this.memberRepo.find({
      where: { project_id: projectId },
    });

    if (!members || members.length === 0) {
      return { deleted: 0 };
    }

    await this.memberRepo.remove(members);

    return { deleted: members.length };
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
