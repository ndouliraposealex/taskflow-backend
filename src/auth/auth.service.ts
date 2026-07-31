import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { UsersService } from '../users/users.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { User } from '../users/entities/user.entity'

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  private buildToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role }
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, joinedAt: user.joinedAt },
    }
  }

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto)
    return this.buildToken(user)
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email)
    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect')

    const passwordMatches = await bcrypt.compare(dto.password, user.password)
    if (!passwordMatches) throw new UnauthorizedException('Email ou mot de passe incorrect')

    return this.buildToken(user)
  }
}
