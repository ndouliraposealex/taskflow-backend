/**
 * Script de seed: cree un admin, un utilisateur demo, et quelques taches.
 * Usage: npm run seed
 */
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { User } from '../users/entities/user.entity'
import { Task } from '../tasks/entities/task.entity'
import { Role } from '../common/enums/role.enum'

async function seed() {
  const ds = new DataSource({
    type: 'sqlite',
    database: process.env.DB_PATH || 'taskflow.sqlite',
    entities: [User, Task],
    synchronize: true,
  })
  await ds.initialize()

  const userRepo = ds.getRepository(User)
  const taskRepo = ds.getRepository(Task)

  const passwordHash = await bcrypt.hash('password123', 10)

  let admin = await userRepo.findOne({ where: { email: 'admin@taskflow.sn' } })
  if (!admin) {
    admin = await userRepo.save(userRepo.create({ name: 'Admin TaskFlow', email: 'admin@taskflow.sn', password: passwordHash, role: Role.ADMIN }))
    console.log('Admin cree: admin@taskflow.sn / password123')
  }

  let demo = await userRepo.findOne({ where: { email: 'ibrahima@taskflow.sn' } })
  if (!demo) {
    demo = await userRepo.save(userRepo.create({ name: 'Ibrahima Diallo', email: 'ibrahima@taskflow.sn', password: passwordHash, role: Role.USER }))
    console.log('Utilisateur cree: ibrahima@taskflow.sn / password123')

    const sample = [
      { title: 'Finaliser le rapport mensuel', description: 'Inclure les KPIs du Q1', priority: 'urgent', category: 'work', status: 'in_progress', tags: ['rapport', 'Q1'] },
      { title: 'Reviser le module NestJS', priority: 'high', category: 'learning', status: 'todo', tags: ['nestjs', 'backend'] },
      { title: 'Seance de sport - 45 min', priority: 'medium', category: 'health', status: 'done', completedAt: new Date() },
      { title: "Deployer l'API sur le cloud", priority: 'urgent', category: 'work', status: 'todo', tags: ['deploy'] },
      { title: 'Preparer la soutenance', priority: 'urgent', category: 'work', status: 'in_progress', tags: ['examen'] },
    ]
    for (const t of sample) {
      await taskRepo.save(taskRepo.create({ ...t, ownerId: demo.id } as any))
    }
    console.log(`${sample.length} taches de demonstration creees`)
  }

  await ds.destroy()
  console.log('Seed termine.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
