import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, JoinColumn, Index,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type Category = 'work' | 'personal' | 'health' | 'learning' | 'other'
export type Status = 'todo' | 'in_progress' | 'done'

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'varchar', default: 'medium' })
  priority: Priority

  @Column({ type: 'varchar', default: 'other' })
  category: Category

  @Column({ type: 'varchar', default: 'todo' })
  @Index()
  status: Status

  @Column({ name: 'due_date', type: 'datetime', nullable: true })
  dueDate?: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt?: Date

  // SQLite ne supporte pas les colonnes tableau natives -> stockage JSON serialise
  @Column({ type: 'simple-json', nullable: true })
  tags?: string[]

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User

  @Column({ name: 'owner_id' })
  @Index()
  ownerId: string
}
