export class CreateStatusDto {
  workflow_id: number;
  name: string;
  color: string;
  is_start?: boolean;
  is_final?: boolean;
}

export class UpdateStatusDto {
  name?: string;
  color: string;
  is_start?: boolean;
  is_final?: boolean;
}
