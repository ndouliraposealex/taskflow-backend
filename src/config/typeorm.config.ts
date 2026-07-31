import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { User } from '../users/entities/user.entity'
import { Task } from '../tasks/entities/task.entity'

/**
 * SQLite est utilise par defaut: aucune installation de serveur de base de
 * donnees requise, ideal pour le developpement et la demonstration.
 * Pour passer a PostgreSQL en production, changer "type" en "postgres" et
 * fournir DATABASE_URL (voir docker-compose.yml fourni en bonus).
 */
export const getTypeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'sqlite',
  database: config.get<string>('DB_PATH', 'taskflow.sqlite'),
  entities: [User, Task],
  synchronize: true, // OK pour un projet academique/demo ; utiliser des migrations en production
  logging: false,
})
