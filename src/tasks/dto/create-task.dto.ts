import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { Category, Priority, Status } from '../entities/task.entity'

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']
const CATEGORIES: Category[] = ['work', 'personal', 'health', 'learning', 'other']
const STATUSES: Status[] = ['todo', 'in_progress', 'done']

export class CreateTaskDto {
  @ApiProperty({ example: 'Finaliser le rapport mensuel' })
  @IsString()
  @MinLength(2, { message: 'Le titre doit contenir au moins 2 caracteres' })
  @MaxLength(150)
  title: string

  @ApiPropertyOptional({ example: 'Inclure les KPIs du Q1' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @ApiPropertyOptional({ enum: PRIORITIES, default: 'medium' })
  @IsOptional()
  @IsEnum(PRIORITIES, { message: `priority doit etre parmi: ${PRIORITIES.join(', ')}` })
  priority?: Priority

  @ApiPropertyOptional({ enum: CATEGORIES, default: 'other' })
  @IsOptional()
  @IsEnum(CATEGORIES, { message: `category doit etre parmi: ${CATEGORIES.join(', ')}` })
  category?: Category

  @ApiPropertyOptional({ enum: STATUSES, default: 'todo' })
  @IsOptional()
  @IsEnum(STATUSES, { message: `status doit etre parmi: ${STATUSES.join(', ')}` })
  status?: Status

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  dueDate?: string

  @ApiPropertyOptional({ example: ['rapport', 'Q1'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}
