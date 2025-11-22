export class ProjectListDto {
  id: number;
  code: string;
  name: string;
  description?: string;

  creatorId: number;
  creatorName?: string;

  createdAt: Date;
  updatedAt: Date;
}
