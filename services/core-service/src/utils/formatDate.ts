import { BadRequestException } from '@nestjs/common';

export function formatDate(date: string) {
  const [day, month, year] = date.split('-');

  const dateFormated = new Date(Number(year), Number(month) - 1, Number(day));

  if (isNaN(dateFormated.getTime())) {
    throw new BadRequestException(
      'Invalid joinDate format. Expect DD-MM-YYYY.',
    );
  }

  return dateFormated;
}
