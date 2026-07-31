import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { AxiosError } from 'axios'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name)
  private readonly TTL_SECONDS = 10 * 60 // 10 minutes - evite de spammer l'API externe (performance)

  constructor(private http: HttpService, private config: ConfigService, private redis: RedisService) {}

  async getWeather(city: string) {
    const key = `weather:${city.toLowerCase().trim()}`
    const cached = await this.redis.get(key)
    if (cached) return JSON.parse(cached)

    const apiKey = this.config.get<string>('OPENWEATHER_API_KEY')
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new HttpException(
        "Cle OpenWeather manquante. Ajoutez OPENWEATHER_API_KEY dans le fichier .env (cle gratuite sur openweathermap.org)",
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }

    try {
      const { data } = await firstValueFrom(
        this.http.get('https://api.openweathermap.org/data/2.5/weather', {
          params: { q: city, appid: apiKey, units: 'metric', lang: 'fr' },
          timeout: 8000,
        }),
      )

      const result = {
        city: data.name,
        country: data.sys?.country,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather?.[0]?.main,
        description: data.weather?.[0]?.description,
        icon: data.weather?.[0]?.icon,
        humidity: data.main.humidity,
        windSpeed: data.wind?.speed,
        // Petit plus "outside the box": suggestion de taches adaptee a la meteo du jour
        suggestion: this.buildSuggestion(data.weather?.[0]?.main, data.main.temp),
      }

      await this.redis.set(key, JSON.stringify(result), this.TTL_SECONDS)
      return result
    } catch (err) {
      const axiosErr = err as AxiosError
      this.logger.error(`Echec appel OpenWeather: ${axiosErr.message}`)
      if (axiosErr.response?.status === 404) {
        throw new HttpException('Ville introuvable', HttpStatus.NOT_FOUND)
      }
      throw new HttpException("Service meteo indisponible pour le moment", HttpStatus.BAD_GATEWAY)
    }
  }

  private buildSuggestion(condition: string | undefined, tempC: number): string {
    if (!condition) return 'Planifiez votre journee sereinement.'
    const rainy = ['Rain', 'Thunderstorm', 'Drizzle']
    if (rainy.includes(condition)) return 'Journee pluvieuse: privilegiez les taches en interieur (travail, lecture, apprentissage).'
    if (condition === 'Clear' && tempC >= 22) return 'Beau temps: bon moment pour une tache "sante" en exterieur (sport, marche).'
    if (tempC <= 15) return 'Temps frais: idéal pour se concentrer sur vos taches de travail.'
    return 'Conditions favorables pour avancer sur vos taches du jour.'
  }
}
