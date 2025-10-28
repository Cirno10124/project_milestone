export class CreateDependencyDto {
  taskId: number;
  predecessorId: number;
  type?: 'FS' | 'SS' | 'FF' | 'SF';
  lag?: number;
}



