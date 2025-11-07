# Authentication & Authorization Strategy for Microservices

## Overview

This document outlines the authentication and authorization strategy for the microservices architecture, including JWT-based authentication, OAuth 2.0 integration, API Gateway security, and service-to-service authentication.

---

## Authentication Architecture

### Current Monolithic Authentication

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. Login (username/password)
     ▼
┌─────────────────┐
│   Monolithic    │
│   Application   │
│                 │
│  ┌───────────┐  │
│  │   Auth    │  │
│  │Middleware │  │
│  └───────────┘  │
│                 │
│  All modules    │
│  share auth     │
└─────────────────┘
```

### Target Microservices Authentication

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. Login
     ▼
┌─────────────────┐
│  Auth Service   │◀──── Centralized Authentication
│  (OAuth 2.0)    │
└────┬────────────┘
     │ 2. JWT Token
     ▼
┌─────────────────┐
│  API Gateway    │◀──── Token Validation
└────┬────────────┘
     │ 3. Forward with Token
     ├────────┬────────┬────────┬────────┐
     ▼        ▼        ▼        ▼        ▼
┌─────────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│Employee │ │Payroll│ │Billing│ │Inventory│ │...│
│Service  │ │Service│ │Service│ │Service  │ │   │
└─────────┘ └─────┘ └─────┘ └─────┘ └─────┘
     │         │        │        │        │
     └─────────┴────────┴────────┴────────┘
              Service-to-Service Auth
```

---

## 1. Authentication Service

### Responsibilities
- User authentication (login/logout)
- Token generation and validation
- Password management
- Multi-factor authentication (MFA)
- Session management
- OAuth 2.0 provider

### Database Schema

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL, -- admin, hr_manager, payroll_manager, etc.
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, locked
    email_verified BOOLEAN DEFAULT false,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Refresh Tokens Table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Roles and Permissions
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL, -- employees, payroll, invoices, etc.
    action VARCHAR(50) NOT NULL, -- create, read, update, delete
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Audit Log
CREATE TABLE auth_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL, -- login, logout, password_change, etc.
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON auth_audit_log(user_id);
CREATE INDEX idx_audit_event ON auth_audit_log(event_type);
CREATE INDEX idx_audit_created ON auth_audit_log(created_at);
```

### Authentication API

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@company.com",
  "password": "SecurePassword123!",
  "mfaCode": "123456" // Optional, if MFA enabled
}

Response: 200 OK
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "user-uuid",
    "email": "john.doe@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "permissions": [
      "employees:read",
      "payroll:read"
    ]
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response: 200 OK
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer {token}
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response: 204 No Content
```

#### Validate Token
```http
POST /auth/validate
Content-Type: application/json

{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response: 200 OK
{
  "valid": true,
  "user": {
    "id": "user-uuid",
    "email": "john.doe@company.com",
    "role": "employee",
    "permissions": [...]
  }
}
```

---

## 2. JWT Token Structure

### Access Token (Short-lived: 15-60 minutes)

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id-123"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "john.doe@company.com",
    "role": "employee",
    "permissions": [
      "employees:read",
      "employees:update",
      "payroll:read"
    ],
    "iat": 1705320000,
    "exp": 1705323600,
    "iss": "https://auth.erp-company.com",
    "aud": ["employee-service", "payroll-service", "billing-service"]
  },
  "signature": "..."
}
```

### Refresh Token (Long-lived: 7-30 days)

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id-123"
  },
  "payload": {
    "sub": "user-uuid",
    "type": "refresh",
    "jti": "refresh-token-uuid",
    "iat": 1705320000,
    "exp": 1707912000,
    "iss": "https://auth.erp-company.com"
  },
  "signature": "..."
}
```

### Token Generation (TypeScript)

```typescript
// auth.service.ts
import jwt from 'jsonwebtoken';
import fs from 'fs';

export class AuthService {
  private privateKey: string;
  private publicKey: string;

  constructor() {
    this.privateKey = fs.readFileSync('keys/private.pem', 'utf8');
    this.publicKey = fs.readFileSync('keys/public.pem', 'utf8');
  }

  generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      iss: 'https://auth.erp-company.com',
      aud: [
        'employee-service',
        'payroll-service',
        'accounting-service',
        'billing-service',
        'procurement-service',
        'inventory-service',
        'supply-chain-service',
        'finance-service'
      ]
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: '1h',
      keyid: 'key-id-123'
    });
  }

  generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      type: 'refresh',
      jti: generateUUID(),
      iss: 'https://auth.erp-company.com'
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: '7d',
      keyid: 'key-id-123'
    });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://auth.erp-company.com'
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
```

---

## 3. API Gateway Authentication

### Responsibilities
- Validate JWT tokens
- Route requests to appropriate services
- Rate limiting
- Request/response transformation
- Centralized logging

### Kong API Gateway Configuration

```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: employee-service
    url: http://employee-service:3001
    routes:
      - name: employee-routes
        paths:
          - /api/v1/employees
        strip_path: false
    plugins:
      - name: jwt
        config:
          key_claim_name: kid
          secret_is_base64: false
          run_on_preflight: true
      - name: rate-limiting
        config:
          minute: 100
          policy: local

  - name: payroll-service
    url: http://payroll-service:3002
    routes:
      - name: payroll-routes
        paths:
          - /api/v1/payroll
        strip_path: false
    plugins:
      - name: jwt
        config:
          key_claim_name: kid
      - name: rate-limiting
        config:
          minute: 50

  # ... repeat for all services

# JWT Credentials
consumers:
  - username: auth-service
    jwt_secrets:
      - key: key-id-123
        algorithm: RS256
        rsa_public_key: |
          -----BEGIN PUBLIC KEY-----
          MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
          -----END PUBLIC KEY-----
```

### Custom API Gateway (Express)

```typescript
// api-gateway.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const app = express();
const publicKey = fs.readFileSync('keys/public.pem', 'utf8');

// JWT Validation Middleware
const validateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://auth.erp-company.com'
    });

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Service Routes with Authentication
app.use('/api/v1/employees', validateJWT, createProxyMiddleware({
  target: 'http://employee-service:3001',
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    // Forward user info to service
    proxyReq.setHeader('X-User-Id', req.user.sub);
    proxyReq.setHeader('X-User-Email', req.user.email);
    proxyReq.setHeader('X-User-Role', req.user.role);
    proxyReq.setHeader('X-User-Permissions', JSON.stringify(req.user.permissions));
  }
}));

app.use('/api/v1/payroll', validateJWT, createProxyMiddleware({
  target: 'http://payroll-service:3002',
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-User-Id', req.user.sub);
    proxyReq.setHeader('X-User-Email', req.user.email);
    proxyReq.setHeader('X-User-Role', req.user.role);
    proxyReq.setHeader('X-User-Permissions', JSON.stringify(req.user.permissions));
  }
}));

// ... repeat for all services

app.listen(3000, () => {
  console.log('API Gateway running on port 3000');
});
```

---

## 4. Service-Level Authorization

### Permission-Based Access Control

```typescript
// authorization.middleware.ts
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // User info is set by API Gateway in headers
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const userPermissions = JSON.parse(req.headers['x-user-permissions'] as string || '[]');

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Attach user to request
    req.user = {
      id: userId,
      email: userEmail,
      role: userRole,
      permissions: userPermissions
    };

    // Check if user has required permissions
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredPermissions,
        actual: userPermissions
      });
    }

    next();
  };
};

// Usage in routes
import { Router } from 'express';
import { requirePermission } from './middleware/authorization';

const router = Router();

router.post('/employees', 
  requirePermission('employees:create', 'admin'),
  createEmployee
);

router.get('/employees', 
  requirePermission('employees:read'),
  getAllEmployees
);

router.put('/employees/:id', 
  requirePermission('employees:update', 'admin'),
  updateEmployee
);

router.delete('/employees/:id', 
  requirePermission('employees:delete', 'admin'),
  deleteEmployee
);
```

### Role-Based Access Control (RBAC)

```typescript
// roles.config.ts
export const ROLES = {
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  PAYROLL_MANAGER: 'payroll_manager',
  ACCOUNTANT: 'accountant',
  FINANCE_MANAGER: 'finance_manager',
  BILLING_MANAGER: 'billing_manager',
  PROCUREMENT_MANAGER: 'procurement_manager',
  WAREHOUSE_MANAGER: 'warehouse_manager',
  EMPLOYEE: 'employee'
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'employees:*',
    'payroll:*',
    'accounting:*',
    'finance:*',
    'billing:*',
    'procurement:*',
    'inventory:*',
    'supply-chain:*'
  ],
  
  [ROLES.HR_MANAGER]: [
    'employees:create',
    'employees:read',
    'employees:update',
    'employees:delete',
    'departments:*'
  ],
  
  [ROLES.PAYROLL_MANAGER]: [
    'employees:read',
    'payroll:create',
    'payroll:read',
    'payroll:update',
    'payroll:approve'
  ],
  
  [ROLES.ACCOUNTANT]: [
    'accounting:create',
    'accounting:read',
    'accounting:update',
    'transactions:*',
    'journal-entries:*'
  ],
  
  [ROLES.FINANCE_MANAGER]: [
    'accounting:read',
    'finance:*',
    'budgets:*',
    'reports:*'
  ],
  
  [ROLES.BILLING_MANAGER]: [
    'customers:*',
    'invoices:*',
    'payments:*'
  ],
  
  [ROLES.PROCUREMENT_MANAGER]: [
    'vendors:*',
    'purchase-orders:*'
  ],
  
  [ROLES.WAREHOUSE_MANAGER]: [
    'inventory:*',
    'shipments:*',
    'purchase-orders:receive'
  ],
  
  [ROLES.EMPLOYEE]: [
    'employees:read:self',
    'payroll:read:self'
  ]
};
```

---

## 5. Service-to-Service Authentication

### Mutual TLS (mTLS)

```yaml
# Service configuration
services:
  employee-service:
    tls:
      enabled: true
      cert: /certs/employee-service.crt
      key: /certs/employee-service.key
      ca: /certs/ca.crt
      verify_client: true
```

### Service Account Tokens

```typescript
// service-auth.ts
export class ServiceAuthClient {
  private serviceToken: string;

  constructor(
    private serviceName: string,
    private serviceSecret: string
  ) {
    this.serviceToken = this.generateServiceToken();
  }

  private generateServiceToken(): string {
    const payload = {
      sub: this.serviceName,
      type: 'service',
      iss: 'https://auth.erp-company.com',
      aud: ['employee-service', 'payroll-service', '...']
    };

    return jwt.sign(payload, this.serviceSecret, {
      algorithm: 'HS256',
      expiresIn: '1h'
    });
  }

  async callService(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.serviceToken}`,
        'X-Service-Name': this.serviceName
      }
    });
  }
}

// Usage in Payroll Service calling Employee Service
const serviceAuth = new ServiceAuthClient('payroll-service', process.env.SERVICE_SECRET);

const employee = await serviceAuth.callService(
  'http://employee-service:3001/api/v1/employees/emp-uuid'
).then(res => res.json());
```

### API Keys for Internal Services

```typescript
// api-key.middleware.ts
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Validate against stored API keys
  const validKeys = {
    'payroll-service': process.env.PAYROLL_SERVICE_API_KEY,
    'billing-service': process.env.BILLING_SERVICE_API_KEY,
    'procurement-service': process.env.PROCUREMENT_SERVICE_API_KEY
  };

  const serviceName = Object.keys(validKeys).find(
    service => validKeys[service] === apiKey
  );

  if (!serviceName) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.serviceName = serviceName;
  next();
};

// Usage in Employee Service
router.get('/employees/:id/internal',
  validateApiKey,
  getEmployeeForService
);
```

---

## 6. OAuth 2.0 Integration

### Authorization Code Flow (for Web Apps)

```
┌─────────┐                                  ┌─────────────┐
│ Client  │                                  │Auth Service │
│  App    │                                  │ (OAuth 2.0) │
└────┬────┘                                  └──────┬──────┘
     │                                              │
     │ 1. Redirect to /authorize                   │
     │─────────────────────────────────────────────▶│
     │                                              │
     │ 2. User logs in and grants permission        │
     │◀─────────────────────────────────────────────│
     │                                              │
     │ 3. Redirect with authorization code          │
     │◀─────────────────────────────────────────────│
     │                                              │
     │ 4. Exchange code for tokens                  │
     │─────────────────────────────────────────────▶│
     │                                              │
     │ 5. Access token + Refresh token              │
     │◀─────────────────────────────────────────────│
     │                                              │
```

### OAuth 2.0 Endpoints

```http
# Authorization Endpoint
GET /oauth/authorize?
  response_type=code&
  client_id=web-app-client&
  redirect_uri=https://app.company.com/callback&
  scope=employees:read payroll:read&
  state=random-state-string

# Token Endpoint
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTH_CODE&
redirect_uri=https://app.company.com/callback&
client_id=web-app-client&
client_secret=CLIENT_SECRET

Response: 200 OK
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "employees:read payroll:read"
}
```

### Client Credentials Flow (for Service-to-Service)

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=payroll-service&
client_secret=SERVICE_SECRET&
scope=employees:read

Response: 200 OK
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "employees:read"
}
```

---

## 7. Security Best Practices

### Token Storage

**Client-Side (Web)**:
```typescript
// Store access token in memory (not localStorage)
let accessToken: string | null = null;

// Store refresh token in httpOnly cookie
document.cookie = `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict`;

// Refresh token before expiry
setInterval(async () => {
  accessToken = await refreshAccessToken();
}, 50 * 60 * 1000); // Refresh every 50 minutes (token expires in 60)
```

**Client-Side (Mobile)**:
```typescript
// Use secure storage
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('accessToken', accessToken);
await SecureStore.setItemAsync('refreshToken', refreshToken);
```

### Token Rotation

```typescript
// auth.service.ts
async refreshToken(refreshToken: string): Promise<TokenPair> {
  // Verify refresh token
  const decoded = this.verifyToken(refreshToken);
  
  // Check if token is revoked
  const tokenRecord = await this.refreshTokenRepo.findOne({
    where: { token_hash: hashToken(refreshToken) }
  });
  
  if (!tokenRecord || tokenRecord.revoked) {
    throw new Error('Refresh token revoked');
  }
  
  // Generate new tokens
  const user = await this.userRepo.findOne({ where: { id: decoded.sub } });
  const newAccessToken = this.generateAccessToken(user);
  const newRefreshToken = this.generateRefreshToken(user);
  
  // Revoke old refresh token
  await this.refreshTokenRepo.update(
    { id: tokenRecord.id },
    { revoked: true, revoked_at: new Date() }
  );
  
  // Store new refresh token
  await this.refreshTokenRepo.save({
    user_id: user.id,
    token_hash: hashToken(newRefreshToken),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
}
```

### Rate Limiting

```typescript
// rate-limiter.middleware.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const authRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

export const apiRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:'
  }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (req) => {
    // Rate limit by user ID
    return req.user?.id || req.ip;
  }
});

// Usage
app.post('/auth/login', authRateLimiter, loginHandler);
app.use('/api', apiRateLimiter);
```

### Password Security

```typescript
// password.service.ts
import bcrypt from 'bcrypt';
import zxcvbn from 'zxcvbn';

export class PasswordService {
  private readonly SALT_ROUNDS = 12;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validatePasswordStrength(password: string): {
    valid: boolean;
    score: number;
    feedback: string[];
  } {
    const result = zxcvbn(password);
    
    const requirements = [
      password.length >= 12,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^a-zA-Z0-9]/.test(password)
    ];

    const valid = requirements.every(req => req) && result.score >= 3;

    return {
      valid,
      score: result.score,
      feedback: result.feedback.suggestions
    };
  }
}
```

### Multi-Factor Authentication (MFA)

```typescript
// mfa.service.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class MFAService {
  async generateSecret(email: string): Promise<{
    secret: string;
    qrCode: string;
  }> {
    const secret = speakeasy.generateSecret({
      name: `ERP System (${email})`,
      issuer: 'ERP Company'
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode
    };
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps before/after
    });
  }
}

// Enable MFA endpoint
router.post('/auth/mfa/enable', async (req, res) => {
  const { secret, token } = req.body;
  const user = req.user;

  // Verify the token
  const valid = mfaService.verifyToken(secret, token);
  
  if (!valid) {
    return res.status(400).json({ error: 'Invalid MFA token' });
  }

  // Save secret to user
  await userRepo.update(
    { id: user.id },
    { 
      mfa_enabled: true,
      mfa_secret: secret
    }
  );

  res.json({ message: 'MFA enabled successfully' });
});
```

---

## 8. Audit Logging

```typescript
// audit.service.ts
export class AuditService {
  async logAuthEvent(event: {
    userId?: string;
    eventType: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    failureReason?: string;
  }): Promise<void> {
    await this.auditRepo.save({
      user_id: event.userId,
      event_type: event.eventType,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      success: event.success,
      failure_reason: event.failureReason,
      created_at: new Date()
    });

    // Also publish event for monitoring
    await this.eventPublisher.publish('auth.events', 'auth.event', {
      eventType: 'AuthEvent',
      data: event
    });
  }
}

// Usage in login handler
async login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await this.authService.authenticate(email, password);
    
    await this.auditService.logAuthEvent({
      userId: user.id,
      eventType: 'login',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.json({ accessToken, refreshToken, user });
  } catch (error) {
    await this.auditService.logAuthEvent({
      eventType: 'login',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: false,
      failureReason: error.message
    });

    res.status(401).json({ error: 'Invalid credentials' });
  }
}
```

---

## Summary

### Authentication Flow
1. User logs in via Auth Service
2. Auth Service validates credentials and generates JWT tokens
3. Client stores tokens securely
4. Client includes access token in API requests
5. API Gateway validates token
6. API Gateway forwards request with user context to services
7. Services enforce authorization based on permissions

### Key Security Measures
- ✅ JWT with RS256 (asymmetric encryption)
- ✅ Short-lived access tokens (15-60 minutes)
- ✅ Long-lived refresh tokens (7-30 days)
- ✅ Token rotation on refresh
- ✅ Permission-based access control
- ✅ Service-to-service authentication
- ✅ Rate limiting
- ✅ Password hashing with bcrypt
- ✅ Multi-factor authentication
- ✅ Audit logging
- ✅ Secure token storage

---

*Continue to [Deployment Strategy](./DEPLOYMENT_STRATEGY.md)*
