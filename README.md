# Product Price Aggregator

A backend service that aggregates pricing and availability data for digital products from multiple third-party providers. Built with NestJS, Prisma, and PostgreSQL.

The service collects data in real-time from external APIs, normalizes it, stores it efficiently, and exposes REST endpoints to query the aggregated data.

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Containerization**: Docker + Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn
- Docker & Docker Compose (for PostgreSQL)

### Setup

1. Clone the repo and install dependencies:

```bash
yarn install
```

2. Copy the environment file and adjust if needed:

```bash
cp .env.example .env
```

3. Start PostgreSQL with Docker:

```bash
yarn docker:up
```

4. Run the app in development mode:

```bash
yarn start:dev
```

The app will be running on `http://localhost:3398`.

### Docker Scripts

| Script | What it does |
|---|---|
| `yarn docker:up` | Start all containers in background |
| `yarn docker:down` | Stop and remove containers |
| `yarn docker:logs` | Follow app container logs |
| `yarn docker:build` | Build containers |
| `yarn docker:restart` | Restart app container |
| `yarn docker:no-cache` | Rebuild containers without cache |

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3398` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5433` |
| `DB_USERNAME` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `Password123` |
| `DB_NAME` | Database name | `products-service` |

The app constructs `DATABASE_URL` from the DB vars automatically. All env variables are validated on startup using Zod, so the app will fail fast if something is missing or wrong.

## Design Decisions

- **Zod for env validation**: I prefer Zod over Joi because it gives better TypeScript inference out of the box. The ConfigService is fully typed so you get autocomplete on `config.get('VARIABLE_NAME')`.
- **Docker Compose**: PostgreSQL runs in a container to keep the local setup simple. The app can run either locally or in a container too.
