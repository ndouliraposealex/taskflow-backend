import { Injectable } from '@nestjs/common'
import * as client from 'prom-client'

@Injectable()
export class MetricsService {
  readonly registry = new client.Registry()

  readonly httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Nombre total de requetes HTTP traitees',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  })

  readonly httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duree des requetes HTTP en secondes',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [this.registry],
  })

  readonly tasksCreatedTotal = new client.Counter({
    name: 'taskflow_tasks_created_total',
    help: "Nombre total de taches creees depuis le demarrage de l'application",
    registers: [this.registry],
  })

  constructor() {
    // Metriques par defaut de Node.js (CPU, memoire, event loop, GC...)
    client.collectDefaultMetrics({ register: this.registry })
  }
}
