import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { UsersService } from './users.service'
import { User } from './entities/user.entity'
import { Role } from '../common/enums/role.enum'

describe('UsersService', () => {
  let service: UsersService
  let repo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock; find: jest.Mock; delete: jest.Mock }

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 'user-1', ...data })),
      find: jest.fn(),
      delete: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: repo }],
    }).compile()

    service = module.get(UsersService)
  })

  it('devrait creer un utilisateur avec un mot de passe hashe et le role USER par defaut', async () => {
    repo.findOne.mockResolvedValue(null)

    const user = await service.create({ name: 'Alex', email: 'alex@test.sn', password: 'password123' })

    expect(user.email).toBe('alex@test.sn')
    expect(user.role).toBe(Role.USER)
    expect(user.password).not.toBe('password123') // le mot de passe doit etre hashe
  })

  it('devrait rejeter la creation si l\'email existe deja (409)', async () => {
    repo.findOne.mockResolvedValue({ id: 'existing', email: 'alex@test.sn' })

    await expect(
      service.create({ name: 'Alex', email: 'alex@test.sn', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('devrait lever une NotFoundException si l\'utilisateur est introuvable', async () => {
    repo.findOne.mockResolvedValue(null)
    await expect(service.findOne('unknown-id')).rejects.toBeInstanceOf(NotFoundException)
  })
})
