# --- Etape 1: build ---
FROM node:20-alpine AS builder
WORKDIR /app

# sqlite3 a un binding natif: ces outils permettent sa compilation si aucun binaire precompile n'est disponible pour la plateforme
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Etape 2: image de production (legere, sans les devDependencies) ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Volume pour persister la base SQLite en dehors du conteneur
VOLUME ["/app/data"]
ENV DB_PATH=/app/data/taskflow.sqlite

EXPOSE 3000
CMD ["node", "dist/main.js"]
