import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { Role } from '../common/enums/role.enum'

describe('AuthService', () => {
  let service: AuthService
  let usersService: { findByEmail: jest.Mock; create: jest.Mock }

  const hashedPassword = bcrypt.hashSync('correct-password', 10)
  const mockUser = {
    id: 'user-1',
    name: 'Alex',
    email: 'alex@test.sn',
    password: hashedPassword,
    role: Role.USER,
    avatar: undefined,
    joinedAt: new Date(),
  }

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: { sign: jest.fn(() => 'fake-jwt-token') } },
      ],
    }).compile()

    service = module.get(AuthService)
  })

  it('devrait connecter un utilisateur avec les bons identifiants et renvoyer un token', async () => {
    usersService.findByEmail.mockResolvedValue(mockUser)

    const result = await service.login({ email: 'alex@test.sn', password: 'correct-password' })

    expect(result.accessToken).toBe('fake-jwt-token')
    expect(result.user.email).toBe('alex@test.sn')
    expect((result.user as any).password).toBeUndefined() // le mot de passe ne doit jamais etre renvoye
  })

  it('devrait rejeter une connexion avec un mauvais mot de passe (401)', async () => {
    usersService.findByEmail.mockResolvedValue(mockUser)

    await expect(
      service.login({ email: 'alex@test.sn', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('devrait rejeter une connexion si l\'email est inconnu (401, sans reveler que l\'email n\'existe pas)', async () => {
    usersService.findByEmail.mockResolvedValue(null)

    await expect(
      service.login({ email: 'inconnu@test.sn', password: 'whatever' }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('devrait deleguer l\'inscription a UsersService et renvoyer un token', async () => {
    usersService.create.mockResolvedValue(mockUser)

    const result = await service.register({ name: 'Alex', email: 'alex@test.sn', password: 'correct-password' })

    expect(usersService.create).toHaveBeenCalled()
    expect(result.accessToken).toBe('fake-jwt-token')
  })
})
