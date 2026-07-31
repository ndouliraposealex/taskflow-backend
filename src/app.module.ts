import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import { getTypeOrmConfig } from './config/typeorm.config'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { TasksModule } from './tasks/tasks.module'
import { StatsModule } from './stats/stats.module'
import { WeatherModule } from './weather/weather.module'
import { RedisModule } from './redis/redis.module'
import { MetricsModule } from './metrics/metrics.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), // limite basique anti-abus sur l'API
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    RedisModule,
    MetricsModule,
    AuthModule,
    UsersModule,
    TasksModule,
    StatsModule,
    WeatherModule,
  ],
})
export class AppModule {}
