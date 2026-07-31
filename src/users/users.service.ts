import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { User } from './entities/user.entity'
import { Role } from '../common/enums/role.enum'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async create(data: { name: string; email: string; password: string; role?: Role }): Promise<User> {
    const existing = await this.usersRepo.findOne({ where: { email: data.email } })
    if (existing) throw new ConflictException('Un compte existe deja avec cet email')

    const hashed = await bcrypt.hash(data.password, 10)
    const user = this.usersRepo.create({ ...data, password: hashed, role: data.role ?? Role.USER })
    return this.usersRepo.save(user)
  }

  findAll(): Promise<User[]> {
    return this.usersRepo.find({ order: { joinedAt: 'DESC' } })
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException('Utilisateur introuvable')
    return user
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } })
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepo.delete(id)
    if (result.affected === 0) throw new NotFoundException('Utilisateur introuvable')
  }
}
