# ERP Microservices Architecture

This directory contains the complete implementation of the ERP system microservices architecture.

## Architecture Overview

The system is composed of 8 independent microservices, an API Gateway, and an Authentication Service:

```
┌─────────────────┐
│   API Gateway   │ (Port 3000)
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┬────────┬────────┬────────┬────────┐
    │         │        │        │        │        │        │        │
┌───▼───┐ ┌──▼──┐ ┌───▼───┐ ┌──▼──┐ ┌──▼──┐ ┌───▼───┐ ┌──▼──┐ ┌──▼──┐
│Employee│ │Payroll│ │Account│ │Billing│ │Procure│ │Inventory│ │Supply│ │Finance│
│:3001   │ │:3002  │ │:3003  │ │:3004  │ │:3005  │ │:3006   │ │:3007 │ │:3008  │
└────────┘ └───────┘ └───────┘ └───────┘ └───────┘ └────────┘ └──────┘ └───────┘
```

## Services

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| **API Gateway** | 3000 | - | Request routing, authentication, rate limiting |
| **Auth Service** | 3009 | auth_db | User authentication and authorization |
| **Employee Service** | 3001 | employee_db | Employee master data management |
| **Payroll Service** | 3002 | payroll_db | Salary processing and tax calculations |
| **Accounting Service** | 3003 | accounting_db | General ledger and financial transactions |
| **Billing Service** | 3004 | billing_db | Customer invoicing and payments |
| **Procurement Service** | 3005 | procurement_db | Vendor and purchase order management |
| **Inventory Service** | 3006 | inventory_db | Stock management and valuation |
| **Supply Chain Service** | 3007 | supply_chain_db | Shipment and logistics tracking |
| **Finance Service** | 3008 | finance_db | Budgeting and financial reporting |

## Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5+
- **Message Broker**: RabbitMQ
- **API Gateway**: Custom Express-based
- **Authentication**: JWT with RS256
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- RabbitMQ (or use Docker)

## Quick Start

### 1. Clone and Install

```bash
# Install root dependencies
npm install

# Install all service dependencies
npm run install:all
```

### 2. Environment Setup

```bash
# Copy environment files for all services
npm run setup:env

# Or manually copy for each service
cp services/employee-service/.env.example services/employee-service/.env
# ... repeat for all services
```

### 3. Start with Docker Compose (Recommended)

```bash
# Start all services with databases
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 4. Start Locally (Development)

```bash
# Start databases and RabbitMQ
docker-compose up -d postgres rabbitmq

# Run database migrations
npm run migrate:all

# Start all services in development mode
npm run dev

# Or start individual services
cd services/employee-service && npm run dev
```

## Development

### Project Structure

```
services/
├── shared/                    # Shared utilities and types
│   ├── types/                # Common TypeScript types
│   ├── utils/                # Shared utility functions
│   ├── middleware/           # Reusable middleware
│   └── events/               # Event schemas and publishers
├── api-gateway/              # API Gateway service
├── auth-service/             # Authentication service
├── employee-service/         # Employee management
├── payroll-service/          # Payroll processing
├── accounting-service/       # Accounting and ledger
├── billing-service/          # Billing and invoicing
├── procurement-service/      # Procurement management
├── inventory-service/        # Inventory management
├── supply-chain-service/     # Supply chain tracking
└── finance-service/          # Financial reporting
```

### Service Structure

Each service follows the same structure:

```
service-name/
├── src/
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic
│   ├── models/               # Data models (if not using Prisma)
│   ├── routes/               # API routes
│   ├── middleware/           # Service-specific middleware
│   ├── utils/                # Utility functions
│   ├── events/               # Event handlers
│   ├── config/               # Configuration
│   └── server.ts             # Entry point
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── tests/                    # Unit and integration tests
├── .env.example              # Environment variables template
├── .dockerignore
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## Database Migrations

```bash
# Generate Prisma client for all services
npm run prisma:generate

# Run migrations for all services
npm run migrate:all

# Run migrations for a specific service
cd services/employee-service
npx prisma migrate dev

# Reset database (WARNING: deletes all data)
npm run migrate:reset
```

## Testing

```bash
# Run all tests
npm test

# Run tests for a specific service
cd services/employee-service
npm test

# Run tests with coverage
npm run test:coverage
```

## API Documentation

Each service exposes OpenAPI/Swagger documentation at:
- `http://localhost:300X/api-docs`

API Gateway aggregates all documentation at:
- `http://localhost:3000/api-docs`

## Authentication

All API requests (except auth endpoints) require a JWT token:

```bash
# 1. Login to get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "admin123"
  }'

# 2. Use token in requests
curl -X GET http://localhost:3000/api/v1/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Event-Driven Communication

Services communicate asynchronously via RabbitMQ:

- **Exchanges**: Each service has its own exchange (e.g., `employee.events`)
- **Routing Keys**: Events use specific routing keys (e.g., `employee.created`)
- **Consumers**: Services subscribe to relevant events

### Event Flow Example

```
Payroll Service → PayrollProcessed event → RabbitMQ → Accounting Service
                                                    → Finance Service
```

## Monitoring and Logging

- **Logs**: All services log to stdout (JSON format)
- **Health Checks**: Each service exposes `/health` endpoint
- **Metrics**: Prometheus metrics at `/metrics` endpoint

```bash
# Check service health
curl http://localhost:3001/health

# View metrics
curl http://localhost:3001/metrics
```

## Production Deployment

### Docker Images

```bash
# Build all images
docker-compose build

# Build specific service
docker build -t employee-service:latest ./services/employee-service

# Push to registry
docker tag employee-service:latest your-registry/employee-service:latest
docker push your-registry/employee-service:latest
```

### Kubernetes Deployment

Kubernetes manifests are available in the `k8s/` directory:

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n erp-system
```

## Environment Variables

### Common Variables (All Services)

```env
NODE_ENV=development|production
PORT=300X
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
RABBITMQ_URL=amqp://localhost:5672
JWT_PUBLIC_KEY_PATH=./keys/public.pem
LOG_LEVEL=info|debug|error
```

### Service-Specific Variables

See each service's `.env.example` file for specific configuration.

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U postgres
```

### RabbitMQ Issues

```bash
# Check RabbitMQ is running
docker-compose ps rabbitmq

# Access RabbitMQ Management UI
open http://localhost:15672
# Default credentials: guest/guest
```

### Service Not Starting

```bash
# Check service logs
docker-compose logs employee-service

# Restart specific service
docker-compose restart employee-service

# Rebuild and restart
docker-compose up -d --build employee-service
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Run linting: `npm run lint`
5. Run tests: `npm test`
6. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact the development team.
