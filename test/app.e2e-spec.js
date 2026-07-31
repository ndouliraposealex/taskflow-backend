"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = __importStar(require("supertest"));
const app_module_1 = require("../src/app.module");
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret-for-e2e';
process.env.OPENWEATHER_API_KEY = 'test-key-not-used';
describe('TaskFlow API (e2e)', () => {
    let app;
    let accessToken;
    let createdTaskId;
    const testUser = { name: 'Test User', email: `e2e-${Date.now()}@taskflow.sn`, password: 'password123' };
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        app.setGlobalPrefix('api');
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it('POST /api/auth/register -> cree un compte et renvoie un token', async () => {
        const res = await request(app.getHttpServer()).post('/api/auth/register').send(testUser).expect(201);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user.email).toBe(testUser.email);
        expect(res.body.user.password).toBeUndefined();
        accessToken = res.body.accessToken;
    });
    it('POST /api/auth/register -> rejette un email deja utilise (409)', async () => {
        await request(app.getHttpServer()).post('/api/auth/register').send(testUser).expect(409);
    });
    it('POST /api/auth/login -> rejette un mauvais mot de passe (401)', async () => {
        await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'wrong-password' })
            .expect(401);
    });
    it('GET /api/tasks -> refuse l\'acces sans token (401)', async () => {
        await request(app.getHttpServer()).get('/api/tasks').expect(401);
    });
    it('POST /api/tasks -> cree une tache pour l\'utilisateur connecte', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/tasks')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ title: 'Reviser pour l\'examen', priority: 'high', category: 'work', status: 'todo' })
            .expect(201);
        expect(res.body.title).toBe('Reviser pour l\'examen');
        createdTaskId = res.body.id;
    });
    it('POST /api/tasks -> rejette une tache invalide (400, DTO/class-validator)', async () => {
        await request(app.getHttpServer())
            .post('/api/tasks')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ title: '' })
            .expect(400);
    });
    it('GET /api/tasks -> renvoie uniquement les taches de l\'utilisateur connecte', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/tasks')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((t) => t.id === createdTaskId)).toBe(true);
    });
    it('PATCH /api/tasks/:id/toggle -> bascule le statut de la tache', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/api/tasks/${createdTaskId}/toggle`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);
        expect(res.body.status).toBe('done');
    });
    it('GET /api/users -> refuse l\'acces a un utilisateur non-admin (403, RBAC)', async () => {
        await request(app.getHttpServer())
            .get('/api/users')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(403);
    });
    it('DELETE /api/tasks/:id -> supprime la tache', async () => {
        await request(app.getHttpServer())
            .delete(`/api/tasks/${createdTaskId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);
        await request(app.getHttpServer())
            .get(`/api/tasks/${createdTaskId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(404);
    });
});
//# sourceMappingURL=app.e2e-spec.js.map