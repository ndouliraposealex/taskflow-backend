import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm'
import { Exclude } from 'class-transformer'
import { Role } from '../../common/enums/role.enum'
import { Task } from '../../tasks/entities/task.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ unique: true })
  email: string

  @Column()
  @Exclude() // n'est jamais renvoye dans les reponses JSON
  password: string

  @Column({ type: 'varchar', default: Role.USER })
  role: Role

  @Column({ nullable: true })
  avatar?: string

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date

  @OneToMany(() => Task, (task) => task.owner)
  tasks: Task[]
}
