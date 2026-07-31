import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { WeatherService } from './weather.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

@ApiTags('weather')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('weather')
export class WeatherController {
  constructor(private weatherService: WeatherService) {}

  @Get()
  @ApiQuery({ name: 'city', required: false, example: 'Dakar' })
  @ApiOperation({ summary: "Meteo actuelle pour le tableau de bord (API externe OpenWeather)" })
  getWeather(@Query('city') city = 'Dakar') {
    return this.weatherService.getWeather(city)
  }
}
