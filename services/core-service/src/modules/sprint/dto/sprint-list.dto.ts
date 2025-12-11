

export class SprintListDto {
  id: number;
  releaseName: string | null;
  projectId:number;
  releaseId: number;
  name: string;
  key:string;
  startDate: Date;
  endDate: Date;
  isActive:boolean;
  numOfIssue?:number
}
