# Docker Deployment Guide - Enterprise Resource Planning API v2

This guide provides comprehensive instructions for deploying the Enterprise Resource Planning API v2 using Docker and Docker Compose.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker**: Version 20.10 or higher ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 2.0 or higher ([Install Docker Compose](https://docs.docker.com/compose/install/))
- **Git**: For cloning the repository (optional)

Verify installations:
```bash
docker --version
docker-compose --version
```

## 🚀 Quick Start

### 1. Clone or Navigate to the Project Directory

```bash
cd /path/to/enterprise-resource-planning
```

### 2. Configure Environment Variables

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

**Important**: Edit `.env` and update the following critical values:
- `JWT_SECRET` - Use a strong, random secret key
- `AUTH_TOKEN` - Set your bearer token for API authentication
- `DB_PASSWORD` - Set a strong database password

Generate a secure JWT secret:
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Build and Start the Services

```bash
# Build and start all services in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f erp-api
```

### 4. Verify Deployment

Check if the API is running:

```bash
# Health check
curl http://localhost:3001/health

# API info
curl http://localhost:3001/api/v2
```

Expected response from health check:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📦 What's Included

The Docker deployment includes:

- **ERP API Container**: Node.js 20 Alpine-based container running the API
- **PostgreSQL Database**: PostgreSQL 16 for data persistence
- **Health Checks**: Automatic health monitoring for all services
- **Volume Persistence**: Data persists across container restarts
- **Network Isolation**: Services communicate via a dedicated Docker network

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Docker Host (localhost)         │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     ERP API Container             │ │
│  │     Port: 3001                    │ │
│  │     Node.js 20 Alpine             │ │
│  └───────────┬───────────────────────┘ │
│              │                          │
│              │ erp-network              │
│              │                          │
│  ┌───────────▼───────────────────────┐ │
│  │     PostgreSQL Container          │ │
│  │     Port: 5432                    │ │
│  │     Version: 16                   │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🔧 Configuration

### Environment Variables

Key environment variables you can configure in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `PORT` | API port | `3001` |
| `JWT_SECRET` | Secret key for JWT tokens | *Must be changed* |
| `AUTH_TOKEN` | Bearer token for API auth | *Must be changed* |
| `DB_HOST` | Database hostname | `db` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `erp_database` |
| `DB_USER` | Database user | `erp_user` |
| `DB_PASSWORD` | Database password | *Must be changed* |
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### Port Configuration

By default, the API is exposed on port `3001`. To change this:

1. Update `docker-compose.yml`:
   ```yaml
   ports:
     - "8080:3001"  # Maps host port 8080 to container port 3001
   ```

2. Update `BASE_URL` in `.env`:
   ```
   BASE_URL=http://localhost:8080
   ```

## 🛠️ Common Operations

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d erp-api
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f erp-api

# Last 100 lines
docker-compose logs --tail=100 erp-api
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart erp-api
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker-compose up -d --build

# Force rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Execute Commands in Container

```bash
# Open shell in API container
docker-compose exec erp-api sh

# Run Node.js command
docker-compose exec erp-api node -v

# Check environment variables
docker-compose exec erp-api env
```

### Database Operations

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U erp_user -d erp_database

# Backup database
docker-compose exec db pg_dump -U erp_user erp_database > backup.sql

# Restore database
docker-compose exec -T db psql -U erp_user erp_database < backup.sql
```

## 🔍 Health Checks

The deployment includes automatic health checks:

### API Health Check
- **Endpoint**: `http://localhost:3001/health`
- **Interval**: Every 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3 attempts

### Database Health Check
- **Command**: `pg_isready`
- **Interval**: Every 10 seconds
- **Timeout**: 5 seconds
- **Retries**: 5 attempts

Check health status:
```bash
docker-compose ps
```

## 📊 Monitoring

### View Container Stats

```bash
# Real-time stats
docker stats

# Specific container
docker stats erp-api
```

### Inspect Container

```bash
# Detailed container info
docker inspect erp-api

# Network info
docker network inspect enterprise-resource-planning_erp-network
```

## 🔒 Security Best Practices

1. **Change Default Secrets**: Always update `JWT_SECRET`, `AUTH_TOKEN`, and `DB_PASSWORD`
2. **Use Strong Passwords**: Generate cryptographically secure passwords
3. **Limit Port Exposure**: Only expose necessary ports
4. **Regular Updates**: Keep Docker images updated
5. **Non-Root User**: The Dockerfile uses a non-root user for security
6. **Environment Files**: Never commit `.env` files to version control

## 🐛 Troubleshooting

### API Won't Start

```bash
# Check logs
docker-compose logs erp-api

# Check if port is already in use
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Check database logs
docker-compose logs db

# Verify database is running
docker-compose ps db

# Test connection
docker-compose exec db pg_isready -U erp_user
```

### Container Keeps Restarting

```bash
# Check logs for errors
docker-compose logs --tail=50 erp-api

# Check health status
docker inspect erp-api | grep -A 10 Health
```

### Out of Disk Space

```bash
# Remove unused containers, images, and volumes
docker system prune -a --volumes

# Check disk usage
docker system df
```

## 🚀 Production Deployment

For production environments, consider:

1. **Use Docker Secrets** for sensitive data
2. **Set up SSL/TLS** with a reverse proxy (nginx, Traefik)
3. **Configure logging** to external services (ELK, Splunk)
4. **Set up monitoring** (Prometheus, Grafana)
5. **Implement backup strategy** for database
6. **Use orchestration** (Kubernetes, Docker Swarm) for scaling
7. **Configure resource limits** in docker-compose.yml:

```yaml
services:
  erp-api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## 📚 API Documentation

Once deployed, access the API:

- **Health Check**: `http://localhost:3001/health`
- **API Info**: `http://localhost:3001/api/v2`

### Available Modules

The API includes the following modules:

- **System**: Health checks and API information
- **Human Resources**: Employee and department management
- **Payroll**: Salary processing and tax calculations
- **Accounting**: General ledger and financial transactions
- **Finance**: Budgeting and financial reporting
- **Billing**: Invoicing and customer billing
- **Procurement**: Purchase orders and vendor management
- **Supply Chain**: Shipments and logistics
- **Inventory**: Stock tracking and management

### Authentication

Most endpoints require Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     http://localhost:3001/api/v2/hr/employees
```

## 🔄 Updates and Maintenance

### Update Docker Images

```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest images
docker-compose up -d --build
```

### Backup Strategy

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U erp_user erp_database > "backup_${DATE}.sql"
echo "Backup created: backup_${DATE}.sql"
EOF

chmod +x backup.sh
./backup.sh
```

## 📞 Support

For issues or questions:

1. Check the logs: `docker-compose logs -f`
2. Review this documentation
3. Check Docker and Docker Compose documentation
4. Verify environment variables are correctly set

## 📄 License

Refer to the main project LICENSE file for licensing information.

---

**Last Updated**: December 2024  
**API Version**: v2.0.0  
**Docker Version**: 20.10+  
**Docker Compose Version**: 2.0+
