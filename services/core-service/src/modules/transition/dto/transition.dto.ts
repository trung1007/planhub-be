export class CreateTransitionDto {
  workflow_id: number;
  status_id_from: number;
  status_id_to: number;
  name: string;
  created_by: number;
}

export class UpdateTransitionDto {
  name?: string;
  status_id_from?: number;
  status_id_to?: number;
}
