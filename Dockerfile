# ---- Stage 1: Install ALL dependencies (build + runtime) ----
FROM node:20-alpine AS deps

RUN corepack enable

WORKDIR /app

COPY package.json yarn.lock ./
COPY prisma ./prisma

RUN --mount=type=cache,target=/root/.cache/yarn \
  yarn install --frozen-lockfile

# ---- Stage 2: Build the application ----
FROM node:20-alpine AS build

RUN corepack enable

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY package.json yarn.lock tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

RUN yarn build

# Remove dev dependencies after build, keep only production ones
RUN --mount=type=cache,target=/root/.cache/yarn \
  yarn install --frozen-lockfile --production && \
  yarn cache clean

# Regenerate Prisma Client for the final alpine runtime
RUN npx prisma generate

# ---- Stage 3: Production image ----
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# dumb-init for proper PID 1 signal handling (graceful shutdown)
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy only what's needed to run
COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=build --chown=appuser:appgroup /app/package.json ./
COPY --chown=appuser:appgroup public ./public

ENV NODE_ENV=production

USER appuser

EXPOSE 3398

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
