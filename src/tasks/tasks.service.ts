import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ILike, Repository } from 'typeorm'
import { Task } from './entities/task.entity'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { QueryTaskDto } from './dto/query-task.dto'
import { Role } from '../common/enums/role.enum'
import { MetricsService } from '../metrics/metrics.service'

interface RequestUser {
  userId: string
  role: Role
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private tasksRepo: Repository<Task>,
    private metrics: MetricsService,
  ) {}

  async create(ownerId: string, dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepo.create({
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      ownerId,
    })
    const saved = await this.tasksRepo.save(task)
    this.metrics.tasksCreatedTotal.inc()
    return saved
  }

  /**
   * Un utilisateur "user" ne voit que ses propres taches.
   * Un "admin" peut voir toutes les taches (utile pour la supervision).
   */
  findAll(user: RequestUser, query: QueryTaskDto): Promise<Task[]> {
    const where: any = user.role === Role.ADMIN ? {} : { ownerId: user.userId }
    if (query.priority) where.priority = query.priority
    if (query.category) where.category = query.category
    if (query.status) where.status = query.status
    if (query.search) where.title = ILike(`%${query.search}%`)

    return this.tasksRepo.find({ where, order: { createdAt: 'DESC' } })
  }

  async findOne(id: string, user: RequestUser): Promise<Task> {
    const task = await this.tasksRepo.findOne({ where: { id } })
    if (!task) throw new NotFoundException('Tache introuvable')
    this.assertOwnership(task, user)
    return task
  }

  async update(id: string, dto: UpdateTaskDto, user: RequestUser): Promise<Task> {
    const task = await this.findOne(id, user)

    const wasNotDone = task.status !== 'done'
    Object.assign(task, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : task.dueDate,
    })

    // Renseigne/efface automatiquement completedAt en fonction du statut
    if (dto.status === 'done' && wasNotDone) task.completedAt = new Date()
    if (dto.status && dto.status !== 'done') task.completedAt = undefined

    return this.tasksRepo.save(task)
  }

  async toggleStatus(id: string, user: RequestUser): Promise<Task> {
    const task = await this.findOne(id, user)
    task.status = task.status === 'done' ? 'todo' : 'done'
    task.completedAt = task.status === 'done' ? new Date() : undefined
    return this.tasksRepo.save(task)
  }

  async remove(id: string, user: RequestUser): Promise<void> {
    const task = await this.findOne(id, user)
    await this.tasksRepo.remove(task)
  }

  private assertOwnership(task: Task, user: RequestUser) {
    if (user.role !== Role.ADMIN && task.ownerId !== user.userId) {
      throw new ForbiddenException("Vous n'avez pas acces a cette tache")
    }
  }
}
