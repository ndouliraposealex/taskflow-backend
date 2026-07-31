import { PartialType } from '@nestjs/swagger'
import { CreateTaskDto } from './create-task.dto'

// Toutes les proprietes deviennent optionnelles pour un update partiel (PATCH)
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
