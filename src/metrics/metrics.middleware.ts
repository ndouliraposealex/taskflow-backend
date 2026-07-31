import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { MetricsService } from './metrics.service'

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime()

    res.on('finish', () => {
      // route.path evite l'explosion de cardinalite avec les :id (ex: /tasks/:id plutot que /tasks/38f2...)
      const route = req.route?.path ? req.baseUrl + req.route.path : req.path
      const labels = { method: req.method, route, status_code: String(res.statusCode) }

      this.metrics.httpRequestsTotal.inc(labels)

      const [seconds, nanoseconds] = process.hrtime(start)
      this.metrics.httpRequestDuration.observe(labels, seconds + nanoseconds / 1e9)
    })

    next()
  }
}
