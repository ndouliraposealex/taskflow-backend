import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { TasksService } from './tasks.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { QueryTaskDto } from './dto/query-task.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Creer une nouvelle tache' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(userId, dto)
  }

  @Get()
  @ApiOperation({ summary: 'Lister les taches (filtrable par status/priority/category/search)' })
  findAll(@CurrentUser() user: any, @Query() query: QueryTaskDto) {
    return this.tasksService.findAll(user, query)
  }

  @Get(':id')
  @ApiOperation({ summary: "Voir le detail d'une tache" })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.findOne(id, user)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre a jour une tache' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @CurrentUser() user: any) {
    return this.tasksService.update(id, dto, user)
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: "Basculer rapidement le statut d'une tache (todo <-> done)" })
  toggle(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.toggleStatus(id, user)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une tache' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.remove(id, user)
  }
}
