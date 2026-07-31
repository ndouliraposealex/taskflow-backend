import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { TasksService } from './tasks.service'
import { Task } from './entities/task.entity'
import { Role } from '../common/enums/role.enum'
import { MetricsService } from '../metrics/metrics.service'

describe('TasksService', () => {
  let service: TasksService
  let repo: { create: jest.Mock; save: jest.Mock; find: jest.Mock; findOne: jest.Mock; remove: jest.Mock }

  const owner = { userId: 'user-1', role: Role.USER }
  const otherUser = { userId: 'user-2', role: Role.USER }
  const admin = { userId: 'admin-1', role: Role.ADMIN }

  beforeEach(async () => {
    repo = {
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 'task-1', ...data })),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: repo },
        { provide: MetricsService, useValue: { tasksCreatedTotal: { inc: jest.fn() } } },
      ],
    }).compile()

    service = module.get(TasksService)
  })

  it('devrait creer une tache rattachee au proprietaire connecte', async () => {
    const task = await service.create('user-1', { title: 'Reviser NestJS', priority: 'high', category: 'work', status: 'todo' } as any)
    expect(task.ownerId).toBe('user-1')
  })

  it('devrait empecher un utilisateur d\'acceder a la tache d\'un autre utilisateur (403)', async () => {
    repo.findOne.mockResolvedValue({ id: 'task-1', ownerId: 'user-1', title: 'Prive' })

    await expect(service.findOne('task-1', otherUser)).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('devrait autoriser le proprietaire a acceder a sa propre tache', async () => {
    repo.findOne.mockResolvedValue({ id: 'task-1', ownerId: 'user-1', title: 'A moi' })

    const task = await service.findOne('task-1', owner)
    expect(task.title).toBe('A moi')
  })

  it('devrait autoriser un admin a acceder a la tache de n\'importe quel utilisateur (RBAC)', async () => {
    repo.findOne.mockResolvedValue({ id: 'task-1', ownerId: 'user-1', title: 'Pas la sienne' })

    const task = await service.findOne('task-1', admin)
    expect(task.title).toBe('Pas la sienne')
  })

  it('devrait lever une NotFoundException pour une tache inexistante', async () => {
    repo.findOne.mockResolvedValue(null)
    await expect(service.findOne('inconnue', owner)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('toggleStatus devrait basculer todo <-> done et renseigner completedAt', async () => {
    repo.findOne.mockResolvedValue({ id: 'task-1', ownerId: 'user-1', status: 'todo' })

    const task = await service.toggleStatus('task-1', owner)

    expect(task.status).toBe('done')
    expect(task.completedAt).toBeInstanceOf(Date)
  })
})
