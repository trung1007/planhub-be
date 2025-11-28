import { IsArray, ArrayNotEmpty, IsNumber } from "class-validator";

export class UsersByIdsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  ids: number[];
}
