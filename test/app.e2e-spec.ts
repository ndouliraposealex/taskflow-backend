import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

// Base de donnees SQLite en memoire, isolee, remise a zero a chaque run de test
process.env.DB_PATH = ':memory:'
process.env.JWT_SECRET = 'test-secret-for-e2e'
process.env.OPENWEATHER_API_KEY = 'test-key-not-used'

describe('TaskFlow API (e2e)', () => {
  let app: INestApplication
  let accessToken: string
  let createdTaskId: string

  const testUser = { name: 'Test User', email: `e2e-${Date.now()}@taskflow.sn`, password: 'password123' }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('POST /api/auth/register -> cree un compte et renvoie un token', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/register').send(testUser).expect(201)

    expect(res.body.accessToken).toBeDefined()
    expect(res.body.user.email).toBe(testUser.email)
    expect(res.body.user.password).toBeUndefined()

    accessToken = res.body.accessToken
  })

  it('POST /api/auth/register -> rejette un email deja utilise (409)', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send(testUser).expect(409)
  })

  it('POST /api/auth/login -> rejette un mauvais mot de passe (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrong-password' })
      .expect(401)
  })

  it('GET /api/tasks -> refuse l\'acces sans token (401)', async () => {
    await request(app.getHttpServer()).get('/api/tasks').expect(401)
  })

  it('POST /api/tasks -> cree une tache pour l\'utilisateur connecte', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Reviser pour l\'examen', priority: 'high', category: 'work', status: 'todo' })
      .expect(201)

    expect(res.body.title).toBe('Reviser pour l\'examen')
    createdTaskId = res.body.id
  })

  it('POST /api/tasks -> rejette une tache invalide (400, DTO/class-validator)', async () => {
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '' }) // titre vide -> invalide
      .expect(400)
  })

  it('GET /api/tasks -> renvoie uniquement les taches de l\'utilisateur connecte', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.some((t: any) => t.id === createdTaskId)).toBe(true)
  })

  it('PATCH /api/tasks/:id/toggle -> bascule le statut de la tache', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${createdTaskId}/toggle`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(res.body.status).toBe('done')
  })

  it('GET /api/users -> refuse l\'acces a un utilisateur non-admin (403, RBAC)', async () => {
    await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403)
  })

  it('DELETE /api/tasks/:id -> supprime la tache', async () => {
    await request(app.getHttpServer())
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    await request(app.getHttpServer())
      .get(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404)
  })
})
