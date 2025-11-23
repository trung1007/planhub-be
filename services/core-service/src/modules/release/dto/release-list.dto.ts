import { ReleaseStatus } from '../enum/release-status.enum';

export class ReleaseListDto {
  id: number;
  projectName: string;
  projectId: number;
  name: string;
  status: ReleaseStatus;
  version: string;
  startDate: Date;
  endDate: Date;
  description: string;
}
