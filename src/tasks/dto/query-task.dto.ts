import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Category, Priority, Status } from '../entities/task.entity'

export class QueryTaskDto {
  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: Priority

  @ApiPropertyOptional({ enum: ['work', 'personal', 'health', 'learning', 'other'] })
  @IsOptional()
  @IsEnum(['work', 'personal', 'health', 'learning', 'other'])
  category?: Category

  @ApiPropertyOptional({ enum: ['todo', 'in_progress', 'done'] })
  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'done'])
  status?: Status

  @ApiPropertyOptional({ description: 'Recherche texte dans le titre' })
  @IsOptional()
  @IsString()
  search?: string
}
