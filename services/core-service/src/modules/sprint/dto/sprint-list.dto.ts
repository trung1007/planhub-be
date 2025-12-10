

export class SprintListDto {
  id: number;
  releaseName: string | null;
  releaseId: number;
  name: string;
  key:string;
  startDate: Date;
  endDate: Date;
  isActive:boolean;
  numOfIssue?:number
}
