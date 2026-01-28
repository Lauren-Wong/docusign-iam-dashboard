# DocuSign IAM Workflow Health Dashboard - Implementation Guide

## Architecture Overview

This document outlines the architecture, security considerations, and API integration strategy for connecting the dashboard to DocuSign Maestro.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  - Dashboard UI                                                  │
│  - Real-time updates                                             │
│  - Data visualization                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    Backend API Server (Node.js/Express)          │
│  - Authentication middleware                                     │
│  - Rate limiting                                                 │
│  - Caching layer (Redis)                                        │
│  - Business logic & data transformation                         │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS + JWT
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    DocuSign Maestro API                          │
│  - Workflow definitions                                          │
│  - Workflow instances                                            │
│  - Execution history                                             │
│  - Error logs                                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Security Architecture

### 1. Credential Management (GitHub-Safe)

**NEVER commit to GitHub:**
- API keys
- Access tokens
- Refresh tokens
- Integration keys
- Private keys
- User secrets
- Account IDs

**Environment Variables Strategy:**

```bash
# .env (ADD TO .gitignore!)
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_USER_ID=your_user_guid
DOCUSIGN_ACCOUNT_ID=your_account_id
DOCUSIGN_PRIVATE_KEY_PATH=/secure/path/to/private.key
DOCUSIGN_AUTH_SERVER=https://account-d.docusign.com
DOCUSIGN_API_BASE_URL=https://demo.docusign.net/restapi

# For production
REDIS_URL=redis://your-redis-instance
NODE_ENV=production
```

**File Structure:**
```
project/
├── .env                          # ❌ GITIGNORED - contains secrets
├── .env.example                  # ✅ COMMITTED - template only
├── .gitignore                    # ✅ Must include .env, keys/*, etc.
├── config/
│   ├── docusign.config.js       # ✅ Loads from env vars
│   └── secrets.template.json    # ✅ Template for secret structure
├── keys/                         # ❌ GITIGNORED - RSA keys stored here
│   └── .gitkeep                 # ✅ Only keep folder structure
└── src/
    ├── frontend/
    ├── backend/
    └── services/
        └── docusign.service.js
```

### 2. Authentication Methods

**Recommended: JWT (OAuth 2.0) with RSA Key Pair**

Why JWT over Legacy Auth:
- More secure (no password storage)
- Better for server-to-server integration
- Supports impersonation for admin dashboards
- Shorter-lived tokens reduce risk

**Implementation Flow:**
1. Generate RSA key pair (do this once, locally)
2. Upload public key to DocuSign Admin
3. Store private key securely (environment variable or secret manager)
4. Request JWT access token
5. Use access token for API calls
6. Refresh before expiration

### 3. Secret Management Options

**Development:**
- `.env` file (gitignored)
- Never commit real values

**Production Options:**

1. **Cloud Secret Managers (Recommended):**
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Cloud Secret Manager
   - HashiCorp Vault
   
2. **Platform Environment Variables:**
   - Heroku Config Vars
   - Vercel Environment Variables
   - Netlify Environment Variables
   - GitHub Secrets (for CI/CD only)

3. **Self-Hosted:**
   - Docker secrets
   - Kubernetes secrets
   - Encrypted configuration files (with key management)

## DocuSign Maestro API Integration

### Key Endpoints

```javascript
// Base URL: https://demo.docusign.net/restapi (demo) or production URL

// 1. List all workflows
GET /v2.1/accounts/{accountId}/maestro/workflows

// 2. Get workflow definition
GET /v2.1/accounts/{accountId}/maestro/workflows/{workflowId}

// 3. Get workflow instances (executions)
GET /v2.1/accounts/{accountId}/maestro/workflows/{workflowId}/instances

// 4. Get instance details (specific execution)
GET /v2.1/accounts/{accountId}/maestro/workflows/{workflowId}/instances/{instanceId}

// 5. Get workflow execution history
GET /v2.1/accounts/{accountId}/maestro/workflows/{workflowId}/instances/{instanceId}/history

// 6. Trigger a workflow (for testing)
POST /v2.1/accounts/{accountId}/maestro/workflows/{workflowId}/instances
```

### Data Mapping Strategy

**Workflow Health Calculation:**

```javascript
// Calculate health metrics from Maestro API data
function calculateWorkflowHealth(instances) {
  const total = instances.length;
  const completed = instances.filter(i => i.status === 'completed').length;
  const failed = instances.filter(i => i.status === 'failed').length;
  const inProgress = instances.filter(i => i.status === 'in_progress').length;
  
  const completionRate = (completed / total) * 100;
  
  // Health thresholds
  let status;
  if (completionRate >= 95) status = 'healthy';
  else if (completionRate >= 85) status = 'warning';
  else status = 'critical';
  
  return {
    status,
    completionRate,
    total,
    completed,
    failed,
    inProgress
  };
}
```

**Issue Detection from Maestro Data:**

```javascript
// Analyze workflow instances for common issues
function detectIssues(instances, workflowDefinition) {
  const issues = [];
  
  // Check for timeout patterns
  const timeouts = instances.filter(i => 
    i.errorCode === 'TIMEOUT' || 
    i.failureReason?.includes('timeout')
  );
  if (timeouts.length > instances.length * 0.1) {
    issues.push({
      type: 'warning',
      message: `Timeout rate elevated: ${timeouts.length} timeouts in last ${instances.length} executions`
    });
  }
  
  // Check for API connection failures
  const apiFailures = instances.filter(i =>
    i.errorCode === 'API_ERROR' ||
    i.failureReason?.includes('connection') ||
    i.failureReason?.includes('API')
  );
  if (apiFailures.length > 0) {
    issues.push({
      type: 'error',
      message: `API connection failures detected: ${apiFailures.length} instances`
    });
  }
  
  // Check for routing errors
  const routingErrors = instances.filter(i =>
    i.failureReason?.includes('routing') ||
    i.errorCode === 'ROUTING_ERROR'
  );
  if (routingErrors.length > 0) {
    issues.push({
      type: 'error',
      message: `Routing logic failures: ${routingErrors.length} instances`
    });
  }
  
  // Check average duration vs baseline
  const avgDuration = instances.reduce((sum, i) => sum + (i.duration || 0), 0) / instances.length;
  if (avgDuration > workflowDefinition.baselineDuration * 2) {
    issues.push({
      type: 'warning',
      message: `Average duration ${Math.round(avgDuration/60)}m exceeds baseline by 2x`
    });
  }
  
  return issues;
}
```

### Rate Limiting & Caching

**DocuSign API Limits:**
- Typically 1000 requests per hour per integration
- Varies by account type and endpoint

**Caching Strategy:**

```javascript
// Cache workflow definitions (change infrequently)
// TTL: 1 hour
cache.set(`workflow:${workflowId}:definition`, data, 3600);

// Cache workflow instances (moderate frequency)
// TTL: 5 minutes
cache.set(`workflow:${workflowId}:instances`, data, 300);

// Cache aggregated health metrics (display data)
// TTL: 2 minutes
cache.set(`workflow:${workflowId}:health`, metrics, 120);
```

## Data Collection & Analysis

### Workflow Instance Fields to Capture

```javascript
// Important fields from Maestro API responses
const workflowInstanceData = {
  instanceId: "uuid",
  workflowId: "uuid",
  status: "completed|failed|in_progress|cancelled",
  startedAt: "2025-01-28T10:30:00Z",
  completedAt: "2025-01-28T10:35:00Z",
  duration: 300, // seconds
  triggeredBy: "user_id",
  
  // Error information
  errorCode: "TIMEOUT|API_ERROR|ROUTING_ERROR|VALIDATION_ERROR",
  errorMessage: "Detailed error description",
  failureReason: "Human-readable failure reason",
  failedStepId: "step_uuid",
  
  // Execution details
  steps: [
    {
      stepId: "uuid",
      name: "Send for Signature",
      status: "completed|failed|skipped",
      startedAt: "timestamp",
      completedAt: "timestamp",
      errorMessage: "if failed"
    }
  ],
  
  // Metadata
  metadata: {
    envelopeId: "envelope_uuid",
    recipients: [...],
    customFields: {...}
  }
};
```

### Metrics to Track

1. **Completion Metrics:**
   - Completion rate (%)
   - Average execution time
   - Success vs failure ratio

2. **Performance Metrics:**
   - P50, P95, P99 latency
   - Execution time trends
   - Bottleneck identification

3. **Error Metrics:**
   - Error rate by type
   - Most common failure reasons
   - Failed step analysis

4. **Business Metrics:**
   - Workflows by user/department
   - SLA compliance
   - Peak usage times

## Recommendations Engine

### Rule-Based Recommendations

```javascript
const recommendationRules = [
  {
    condition: (workflow) => workflow.timeoutRate > 0.15,
    priority: 'high',
    action: 'Reduce approval timeout from 48h to 24h',
    impact: 'Could improve completion rate by 8-10%'
  },
  {
    condition: (workflow) => workflow.apiErrorRate > 0.05,
    priority: 'critical',
    action: 'Implement retry logic with exponential backoff for API calls',
    impact: 'Should reduce API failures by 80%+'
  },
  {
    condition: (workflow) => workflow.avgDuration > workflow.baseline * 3,
    priority: 'high',
    action: 'Review and optimize conditional logic and parallel processing',
    impact: 'Reduce execution time to baseline levels'
  },
  {
    condition: (workflow) => workflow.routingErrors > 0,
    priority: 'critical',
    action: 'Fix recipient routing logic - check conditional expressions',
    impact: 'Eliminate routing failures'
  },
  {
    condition: (workflow) => workflow.expirationRate > 0.1,
    priority: 'medium',
    action: 'Extend envelope expiration period',
    impact: 'Reduce premature expiration by 10%'
  }
];

function generateRecommendations(workflow, instances) {
  const stats = calculateWorkflowStats(instances);
  
  return recommendationRules
    .filter(rule => rule.condition({ ...workflow, ...stats }))
    .sort((a, b) => {
      const priority = { critical: 0, high: 1, medium: 2, low: 3 };
      return priority[a.priority] - priority[b.priority];
    });
}
```

## Implementation Checklist

### Phase 1: Backend Setup
- [ ] Set up Node.js/Express server
- [ ] Configure environment variables
- [ ] Implement DocuSign JWT authentication
- [ ] Create service layer for Maestro API calls
- [ ] Add caching with Redis
- [ ] Implement rate limiting
- [ ] Add error handling and logging

### Phase 2: API Integration
- [ ] Fetch workflow definitions
- [ ] Fetch workflow instances with pagination
- [ ] Parse and transform Maestro data
- [ ] Implement health calculation logic
- [ ] Build issue detection engine
- [ ] Create recommendations engine

### Phase 3: Frontend Integration
- [ ] Create API client service
- [ ] Replace mock data with real API calls
- [ ] Add loading states
- [ ] Implement error handling
- [ ] Add real-time refresh
- [ ] Create filtering and search

### Phase 4: Security & Deployment
- [ ] Security audit
- [ ] Set up secret management (production)
- [ ] Configure CORS properly
- [ ] Add authentication for dashboard users
- [ ] Set up monitoring and alerts
- [ ] Deploy to production

## Next Steps

1. **Generate RSA Key Pair** for JWT authentication
2. **Create DocuSign App** in Developer Account
3. **Configure OAuth** and add public key
4. **Set up backend** server structure
5. **Implement authentication** service
6. **Build API service layer** for Maestro
7. **Connect frontend** to backend API

Would you like me to create any of these components next?
