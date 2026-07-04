# Build stage
FROM node:20-slim AS build
WORKDIR /app
# openssl needed by the prisma query engine (loaded during svelte-kit build analysis)
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN npx prisma generate
RUN pnpm run build

# Run stage
FROM node:20-slim
WORKDIR /app
# openssl needed by the prisma query engine
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8
COPY --from=build /app/build ./build
COPY --from=build /app/prisma ./prisma
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod
# server entry + the in-process ws module it imports from source
COPY server.js ./
COPY src/lib/server/ws ./src/lib/server/ws
EXPOSE 3000
# migrations run before start so the container is self-migrating
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
