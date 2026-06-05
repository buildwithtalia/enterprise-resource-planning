# ERP Microservices Architecture

## Overview

This ERP system has been refactored from a **monolithic Flask application** into a
**microservices architecture** — eight independent domain services behind a single
API Gateway.

---

## Service Map

```
Clients
   │
   ▼
┌─────────────────────────┐
│      API Gateway        │  :3010  (public entry point)
│  /api/hr   → hr-svc     │
│  /api/v2/* → same svcs  │
└──────────┬──────────────┘
           │ HTTP (internal)
  ┌────────┼──────────────────────────────┐
  │        │                              │
  ▼        ▼                              ▼
[HR]    [Payroll] ──────────────► [Accounting]
:3011   :3012  calls HR + Acct    :3013
                                     ▲  ▲  ▲
                                     │  │  │
                              [Finance][Billing][Procurement]
                              :3014   :3015   :3016
                                                 ▲
                                                 │ auto-reorder PO
                                           [Inventory]
                                            :3018

[Supply Chain] :3017  (independent — no upstream service calls)
```

### Service Dependency Table

| Service       | Port | Calls              | Called by                   |
|---------------|------|--------------------|-----------------------------|
| API Gateway   | 3010 | all 8 services     | Clients                     |
| HR            | 3011 | —                  | Gateway, Payroll            |
| Payroll       | 3012 | HR, Accounting     | Gateway                     |
| Accounting    | 3013 | —                  | Gateway, Payroll, Billing, Finance, Procurement |
| Finance       | 3014 | Accounting         | Gateway                     |
| Billing       | 3015 | Accounting         | Gateway                     |
| Procurement   | 3016 | Accounting         | Gateway, Inventory          |
| Supply Chain  | 3017 | —                  | Gateway                     |
| Inventory     | 3018 | Procurement        | Gateway                     |

---

## Repository Layout

```
enterprise-resource-planning/
├── shared/                    # Shared utilities (responses, health)
│   ├── __init__.py
│   ├── responses.py           # Standardised JSON envelope helpers
│   └── health.py              # Reusable health-check blueprint
│
├── services/
│   ├── gateway/               # API Gateway
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── src/app.py
│   ├── hr/                    # Human Resources service
│   ├── payroll/               # Payroll service
│   ├── accounting/            # Accounting service
│   ├── finance/               # Finance service
│   ├── billing/               # Billing service
│   ├── procurement/           # Procurement service
│   ├── supply-chain/          # Supply-Chain service
│   └── inventory/             # Inventory service
│
├── src/                       # Legacy monolith (kept for reference)
│
├── docker-compose.yml         # All 9 services (gateway + 8 domain)
├── kubernetes-deployment.yaml # K8s Deployments, Services, HPA
└── postman/                   # API collections & specs
```

---

## Cross-Service Communication

All inter-service calls are synchronous HTTP with graceful degradation:
- A `requests.ConnectionError` or timeout does **not** crash the calling service.
- The downstream call is fire-and-forget for side-effects (e.g., accounting journal entries).
- Future evolution path: replace fire-and-forget HTTP calls with an async message broker
  (e.g., RabbitMQ / Kafka) for better resilience.

### Example: Process Payroll

```
Client → POST /api/payroll/process
         │
         ▼ (Gateway proxies to Payroll)
Payroll service:
  1. Calculates gross/net pay
  2. Stores payroll record locally
  3. POST /api/accounting/journal-entries  ← cross-service (fire-and-forget)
  4. Returns 201 Created
```

### Example: Adjust Stock (triggers reorder)

```
Client → POST /api/inventory/stock/adjust
         │
         ▼ (Gateway proxies to Inventory)
Inventory service:
  1. Updates quantityOnHand
  2. If quantity ≤ reorderPoint:
       POST /api/procurement/purchase-orders  ← cross-service (fire-and-forget)
  3. Returns adjusted stock record
```

---

## API Gateway

- **Single entry point** — all public traffic hits `:3010`.
- **Path-based routing** — `/api/{service}/*` → corresponding microservice.
- **v2 compatibility** — `/api/v2/{service}/*` is stripped and forwarded identically.
- **Aggregate health** — `GET /health` polls each downstream `/health` endpoint and
  returns `200` (all healthy) or `207` (partial degradation).
- **Error surfacing** — `503 SERVICE_UNAVAILABLE` / `504 SERVICE_TIMEOUT` returned
  when a downstream is unreachable.

---

## Running Locally

### Docker Compose (recommended)

```bash
docker compose up --build
```

All services start in dependency order. The gateway waits until every downstream
service passes its healthcheck.

| Endpoint                          | Service          |
|-----------------------------------|------------------|
| `http://localhost:3010/api`       | Service catalogue |
| `http://localhost:3010/health`    | Aggregate health  |
| `http://localhost:3010/api/hr/*`  | HR (via gateway)  |
| `http://localhost:3011`           | HR (direct)       |
| `http://localhost:3012`           | Payroll (direct)  |
| …                                 | …                 |

### Individual service (development)

```bash
cd services/hr
pip install -r requirements.txt
PYTHONPATH=$(pwd)/../.. python src/app.py
```

---

## Kubernetes

```bash
kubectl apply -f kubernetes-deployment.yaml
```

Resources created in the `erp` namespace:
- `Namespace` erp
- `ConfigMap` erp-config (service URLs)
- 9 × `Deployment` (gateway + 8 domain services)
- 9 × `Service` (gateway as LoadBalancer, rest ClusterIP)
- 1 × `HorizontalPodAutoscaler` (gateway, 2–6 replicas)

---

## Key Microservices Design Principles Applied

| Principle                  | Implementation                                                  |
|----------------------------|-----------------------------------------------------------------|
| Single Responsibility      | One domain per service; no shared business logic                |
| Loose Coupling             | HTTP APIs only; no shared in-process imports between services   |
| Independent Deployability  | Each service has its own `Dockerfile` and `requirements.txt`    |
| Graceful Degradation       | Cross-service calls wrapped in try/except; service keeps working|
| Shared Nothing             | Each service owns its own data (in-memory → replace with own DB)|
| API Gateway Pattern        | Single external entry point; internal services are not exposed  |
| Health Checks              | Every service exposes `GET /health`; gateway aggregates them    |

---

## Migration from Monolith

The original monolith (`src/app.py`) is preserved for reference. The new
microservices expose **the same URL paths and response shapes** so existing
Postman collections and OpenAPI specs continue to work unchanged — just point
`baseUrl` to `http://localhost:3010`.
