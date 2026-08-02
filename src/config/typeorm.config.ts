import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { User } from '../users/entities/user.entity'
import { Task } from '../tasks/entities/task.entity'

/**
 * En local (dev) : SQLite par defaut, aucune installation de serveur requise.
 * En production (Vercel) : PostgreSQL, active automatiquement des que la
 * variable DATABASE_URL est presente (fournie par Neon/Supabase/Railway...).
 */
export const getTypeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = config.get<string>('DATABASE_URL')

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [User, Task],
      synchronize: true, // OK pour un projet academique/demo ; utiliser des migrations en production
      logging: false,
      ssl: { rejectUnauthorized: false }, // requis par la plupart des hebergeurs Postgres gratuits (Neon, Supabase...)
    }
  }

  return {
    type: 'sqlite',
    database: config.get<string>('DB_PATH', 'taskflow.sqlite'),
    entities: [User, Task],
    synchronize: true,
    logging: false,
  }
}
