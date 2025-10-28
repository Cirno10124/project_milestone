import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleRunDto } from './create-schedule-run.dto';

export class UpdateScheduleRunDto extends PartialType(CreateScheduleRunDto) {}



