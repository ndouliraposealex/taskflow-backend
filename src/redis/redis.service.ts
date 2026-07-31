import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

/**
 * Fine couche au dessus de Redis pour le cache applicatif (ex: reponses meteo).
 *
 * Bonne pratique de resilience: si REDIS_URL n'est pas configure ou si Redis
 * est injoignable (ex: en dev local sans Docker), le service bascule
 * automatiquement sur un cache en memoire au lieu de faire planter l'app.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis | null = null
  private readonly memoryFallback = new Map<string, { value: string; expiresAt: number }>()

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL')
    if (!url) {
      this.logger.warn('REDIS_URL non defini: cache en memoire utilise (fallback)')
      return
    }

    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // pas de retry infini: on bascule vite sur le fallback
    })

    this.client.on('error', (err) => {
      this.logger.warn(`Redis indisponible (${err.message}) - fallback memoire actif`)
    })

    this.client.connect().then(
      () => this.logger.log('Connecte a Redis'),
      () => { this.client = null },
    )
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.client.status === 'ready') {
      try {
        return await this.client.get(key)
      } catch {
        /* fallback silencieux en dessous */
      }
    }
    const entry = this.memoryFallback.get(key)
    if (!entry) return null
    if (entry.expiresAt < Date.now()) {
      this.memoryFallback.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.client && this.client.status === 'ready') {
      try {
        await this.client.set(key, value, 'EX', ttlSeconds)
        return
      } catch {
        /* fallback silencieux en dessous */
      }
    }
    this.memoryFallback.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  }

  onModuleDestroy() {
    this.client?.disconnect()
  }
}
