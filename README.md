# TaskFlow API — Backend NestJS

API REST du projet **TaskFlow** (gestion de tâches), réalisée pour l'examen final
*API REST* — L2 GI, M. Soumaré (année 2025-2026).

Cette API est consommée par le frontend TaskFlow (React + Vite) fourni séparément.

## Stack technique

- **NestJS 10** + TypeScript
- **TypeORM** + **SQLite** (aucun serveur de base de données à installer — fichier `taskflow.sqlite` généré automatiquement)
- **JWT** (`@nestjs/jwt`, `passport-jwt`) pour l'authentification
- **RBAC** (rôles `user` / `admin`) via un `RolesGuard` custom
- **class-validator** / **class-transformer** pour la validation des DTO
- **Swagger** pour la documentation interactive des endpoints
- **OpenWeather** comme API externe (météo affichée sur le tableau de bord)

## Installation

```bash
cd taskflow-backend
npm install
cp .env.example .env
```

Éditez `.env` si besoin (voir ci-dessous). Par défaut, aucune clé n'est obligatoire
pour démarrer le serveur — seule la route `/weather` a besoin de `OPENWEATHER_API_KEY`.

### Variables d'environnement (`.env`)

| Variable               | Description                                              | Défaut                     |
|-------------------------|-----------------------------------------------------------|-----------------------------|
| `PORT`                 | Port d'écoute du serveur                                  | `3000`                      |
| `CORS_ORIGIN`          | Origine(s) autorisée(s) (le frontend Vite)                | `http://localhost:5173`     |
| `DB_PATH`              | Chemin du fichier SQLite                                   | `taskflow.sqlite`           |
| `REDIS_URL`            | URL Redis pour le cache (optionnel — fallback mémoire si absent) | —                      |
| `JWT_SECRET`           | Secret de signature des tokens JWT                          | — (à définir en prod)       |
| `JWT_EXPIRES_IN`       | Durée de validité du token                                  | `1d`                        |
| `OPENWEATHER_API_KEY`  | Clé API gratuite ([openweathermap.org](https://openweathermap.org/api)) | —          |

### Lancer le serveur

```bash
npm run start:dev     # mode développement, avec rechargement à chaud
```

L'API est servie sur `http://localhost:3000/api`.
La documentation Swagger interactive est disponible sur `http://localhost:3000/api/docs`.

### Jeu de données de démonstration (optionnel)

```bash
npm run seed
```

Crée un compte admin (`admin@taskflow.sn` / `password123`), un compte utilisateur
de démo (`ibrahima@taskflow.sn` / `password123`) et quelques tâches d'exemple.

## Architecture

```
src/
├── auth/          # Inscription, connexion, stratégie JWT
├── users/         # Entité User + gestion des utilisateurs (admin)
├── tasks/         # Entité Task + CRUD complet
├── stats/         # Statistiques calculées à partir des tâches
├── weather/       # Proxy vers l'API externe OpenWeather
├── common/        # Guards, decorators, enums, filtre d'exceptions global
├── config/        # Configuration TypeORM
└── database/      # Script de seed
```

Chaque ressource suit le même découpage (module / controller / service / DTO),
pour une architecture propre et modulaire.

## Authentification & autorisation

- L'inscription (`POST /auth/register`) et la connexion (`POST /auth/login`) renvoient
  un `accessToken` JWT à transmettre dans l'en-tête `Authorization: Bearer <token>`
  pour toutes les routes protégées.
- Deux rôles : `user` (par défaut) et `admin`.
  - Un `user` ne voit et ne modifie que **ses propres tâches**.
  - Un `admin` peut lister toutes les tâches et gérer les utilisateurs
    (`GET /users`, `DELETE /users/:id`, etc.).
- Le contrôle des rôles se fait via le décorateur `@Roles(Role.ADMIN)` combiné
  au `RolesGuard` (voir `src/common/guards/roles.guard.ts`).
- Les mots de passe sont hashés avec `bcrypt` et **ne sont jamais renvoyés** dans les
  réponses JSON (`@Exclude()` + `ClassSerializerInterceptor`).

## Endpoints principaux

### Auth (`/api/auth`)

| Méthode | Route            | Description                        | Protection |
|--------|-------------------|-------------------------------------|------------|
| POST   | `/auth/register`  | Créer un compte, retourne un JWT    | Publique   |
| POST   | `/auth/login`     | Se connecter, retourne un JWT       | Publique   |
| GET    | `/auth/me`        | Profil de l'utilisateur connecté    | JWT        |

### Tasks (`/api/tasks`) — toutes protégées par JWT

| Méthode | Route             | Description                                              |
|--------|--------------------|------------------------------------------------------------|
| GET    | `/tasks`           | Liste des tâches (filtres `?status=&priority=&category=&search=`) |
| GET    | `/tasks/:id`       | Détail d'une tâche                                         |
| POST   | `/tasks`           | Créer une tâche                                             |
| PATCH  | `/tasks/:id`       | Mettre à jour une tâche                                     |
| PATCH  | `/tasks/:id/toggle`| Basculer rapidement le statut (todo ↔ done)                 |
| DELETE | `/tasks/:id`       | Supprimer une tâche                                         |

### Stats (`/api/stats`) — JWT requis

| Méthode | Route     | Description                                                  |
|--------|------------|----------------------------------------------------------------|
| GET    | `/stats`   | Totaux, taux de complétion, répartition par catégorie/priorité, activité des 7 derniers jours |

### Users (`/api/users`) — JWT + rôle `admin` requis

| Méthode | Route        | Description                     |
|--------|---------------|-----------------------------------|
| GET    | `/users`      | Liste de tous les utilisateurs    |
| GET    | `/users/:id`  | Détail d'un utilisateur           |
| DELETE | `/users/:id`  | Supprimer un utilisateur          |

### Weather (`/api/weather`) — JWT requis, API externe

| Méthode | Route                    | Description                                                  |
|--------|---------------------------|------------------------------------------------------------------|
| GET    | `/weather?city=Dakar`      | Météo actuelle (via OpenWeather) + suggestion de tâche adaptée au temps du jour |

## Codes HTTP & gestion des erreurs

Toutes les erreurs passent par un filtre global (`HttpExceptionFilter`) qui renvoie
un format uniforme :

```json
{
  "statusCode": 404,
  "timestamp": "2026-07-25T10:00:00.000Z",
  "path": "/api/tasks/123",
  "method": "GET",
  "message": "Tache introuvable"
}
```

- `400` : validation échouée (DTO / class-validator)
- `401` : token manquant, invalide ou expiré
- `403` : rôle insuffisant, ou tentative d'accès à une ressource d'un autre utilisateur
- `404` : ressource introuvable
- `409` : email déjà utilisé à l'inscription

## Passer à PostgreSQL (optionnel)

Le projet utilise SQLite par défaut pour ne nécessiter aucune installation.
Pour passer à PostgreSQL : dans `src/config/typeorm.config.ts`, remplacer
`type: 'sqlite'` par `type: 'postgres'` et fournir `host`, `port`, `username`,
`password`, `database` (ou une `DATABASE_URL`) via les variables d'environnement.

## Git Flow

Suggestion de branches pour respecter les bonnes pratiques Git Flow demandées :
`main` (production) ← `develop` ← branches `feature/xxx` (une par ressource : auth,
tasks, users, weather, stats), avec des commits atomiques et des messages clairs
(ex : `feat(tasks): ajoute le endpoint de toggle de statut`).

---

## Bonus implémentés

### 🧪 Tests (unitaires + end-to-end)

```bash
npm run test        # tests unitaires (AuthService, UsersService, TasksService)
npm run test:cov     # avec couverture de code
npm run test:e2e     # tests end-to-end (vrai serveur HTTP + base SQLite en mémoire)
```

Les tests unitaires mockent les repositories TypeORM et couvrent notamment les
règles RBAC (un `user` ne peut pas accéder à la tâche d'un autre, un `admin` le peut).
Les tests e2e démarrent la vraie application NestJS et vérifient le parcours complet :
inscription → doublon d'email rejeté → connexion refusée si mauvais mot de passe →
routes protégées (401 sans token, 403 si rôle insuffisant) → CRUD tâches.

### 🐳 Dockerisation

```bash
docker build -t taskflow-backend .
docker run -p 3000:3000 --env-file .env taskflow-backend
```

Ou plus simplement, voir `docker-compose.yml` à la racine du projet fullstack qui
lance **backend + frontend + Redis + Prometheus + Grafana** en une seule commande :

```bash
docker compose up --build
```

- Frontend : http://localhost:8080
- Backend : http://localhost:3000/api
- Swagger : http://localhost:3000/api/docs
- Prometheus : http://localhost:9090
- Grafana : http://localhost:3001 (identifiants : `admin` / `admin`)

### 🔴 Redis

Le cache des réponses météo (`WeatherService`) utilise Redis via `RedisService`
(`src/redis/`). En local sans Redis lancé, le service **bascule automatiquement**
sur un cache en mémoire — aucune configuration n'est obligatoire pour développer,
Redis n'apporte un vrai bénéfice qu'en production/Docker (cache partagé entre
plusieurs instances du backend).

### 📊 Monitoring — Prometheus & Grafana

Un endpoint `GET /api/metrics` expose des métriques au format Prometheus :
nombre de requêtes HTTP par route/code, latence (histogramme), métriques Node.js
par défaut (mémoire, CPU, event loop), et une métrique métier
(`taskflow_tasks_created_total`).

`docker-compose.yml` fournit un Prometheus déjà configuré pour scraper cet endpoint
(`monitoring/prometheus.yml`) et un Grafana avec un dashboard pré-provisionné
(`monitoring/grafana/provisioning/`) affichant le débit de requêtes, la latence P95,
le taux d'erreurs 5xx et la mémoire utilisée.

### ⚙️ Pipeline CI/CD

`.github/workflows/ci.yml` (GitHub Actions) : à chaque push/PR sur `main`/`develop`,
le pipeline installe les dépendances, lance le lint, les tests unitaires, les tests
e2e, le build, puis vérifie que l'image Docker se construit correctement.
