import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { StatsService } from './stats.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get()
  @ApiOperation({ summary: "Statistiques des taches de l'utilisateur connecte (globales si admin)" })
  getStats(@CurrentUser() user: any) {
    return this.statsService.getStats(user)
  }
}
