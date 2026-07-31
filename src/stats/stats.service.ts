import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Task, Category, Priority } from '../tasks/entities/task.entity'
import { Role } from '../common/enums/role.enum'

@Injectable()
export class StatsService {
  constructor(@InjectRepository(Task) private tasksRepo: Repository<Task>) {}

  async getStats(user: { userId: string; role: Role }) {
    const where = user.role === Role.ADMIN ? {} : { ownerId: user.userId }
    const tasks = await this.tasksRepo.find({ where })

    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'done').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const now = new Date()
    const overdue = tasks.filter((t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    const byCategory: Record<Category, number> = { work: 0, personal: 0, health: 0, learning: 0, other: 0 }
    const byPriority: Record<Priority, number> = { low: 0, medium: 0, high: 0, urgent: 0 }
    tasks.forEach((t) => { byCategory[t.category]++; byPriority[t.priority]++ })

    // Activite reelle des 7 derniers jours, basee sur completedAt (pas de donnees aleatoires)
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const weeklyActivity = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dayTasks = tasks.filter((t) => t.completedAt && new Date(t.completedAt).toDateString() === date.toDateString())
      return { day: days[date.getDay()], count: dayTasks.length }
    })

    return { total, completed, inProgress, overdue, completionRate, byCategory, byPriority, weeklyActivity }
  }
}
