import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '../common/enums/role.enum'

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN) // Route reservee aux administrateurs (RBAC)
  @ApiOperation({ summary: 'Lister tous les utilisateurs (admin uniquement)' })
  findAll() {
    return this.usersService.findAll()
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Voir le detail d'un utilisateur (admin uniquement)" })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Supprimer un utilisateur (admin uniquement)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id)
  }
}
