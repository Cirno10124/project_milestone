import { PartialType } from '@nestjs/mapped-types';
import { CreateWbsItemDto } from './create-wbs-item.dto';

export class UpdateWbsItemDto {
  name?: string;
  description?: string;
  duration?: number;
  seq?: number;
}



