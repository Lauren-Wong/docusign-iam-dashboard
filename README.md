# DocuSign IAM Workflow Health Dashboard

A real-time monitoring dashboard for DocuSign Maestro workflows with health metrics, issue detection, and intelligent recommendations.

![Dashboard Preview](docs/screenshot.png)

## 🎯 Features

- **Real-time Workflow Monitoring** - Track completion rates, execution times, and failure patterns
- **Health Status Indicators** - Instant visibility into workflow health (Healthy, Warning, Critical)
- **Intelligent Issue Detection** - Automatic identification of timeouts, API failures, routing errors
- **Smart Recommendations** - Priority-ranked suggestions to fix detected issues
- **Secure API Integration** - JWT authentication with RSA key pairs
- **Performance Optimized** - Built-in caching and rate limiting

## 🏗️ Architecture

```
Frontend (React) ←→ Backend API (Node.js/Express) ←→ DocuSign Maestro API
```

## 🔒 Security

This project is designed to be **GitHub-safe**:
- ✅ No credentials in code
- ✅ Environment variables for all secrets
- ✅ RSA private keys excluded from Git
- ✅ Comprehensive `.gitignore`
- ✅ JWT authentication (no passwords stored)

**NEVER commit:**
- `.env` files
- `*.key` files
- `secrets/` directory
- Any API credentials

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- DocuSign Developer Account (free at https://go.docusign.com/sandbox/productshot)
- OpenSSL (for generating RSA keys)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Lauren-Wong/docusign-iam-dashboard.git
cd docusign-iam-dashboard
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run setup
```

This will:
- Create a `keys/` directory
- Copy `.env.example` to `.env`
- Show you next steps

### 3. Generate RSA Key Pair

```bash
# Generate private key
openssl genrsa -out keys/private.key 2048

# Generate public key
openssl rsa -in keys/private.key -pubout -out keys/public.key
```

⚠️ **IMPORTANT:** Keep your `private.key` secure and NEVER commit it to Git!

### 4. Configure DocuSign Integration

1. **Go to DocuSign Admin Console:**
   - Demo: https://admindemo.docusign.com
   - Production: https://admin.docusign.com

2. **Create Integration Key:**
   - Navigate to: Settings → Integrations → Apps and Keys
   - Click "+ ADD APP AND INTEGRATION KEY"
   - Name it (e.g., "IAM Dashboard")
   - Copy the **Integration Key**

3. **Add RSA Key Pair:**
   - Under your app, click "+ ADD RSA KEYPAIR"
   - Upload `keys/public.key`
   - Save the configuration

4. **Grant User Consent (One-time):**
   ```
   https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=YOUR_INTEGRATION_KEY&redirect_uri=http://localhost:3001
   ```
   - Replace `YOUR_INTEGRATION_KEY` with your actual key
   - Visit URL in browser and grant consent
   - You'll see a consent granted message

### 5. Update Environment Variables

Edit `backend/.env`:

```bash
# DocuSign Configuration
DOCUSIGN_INTEGRATION_KEY=your_integration_key_here
DOCUSIGN_USER_ID=your_user_guid_here
DOCUSIGN_ACCOUNT_ID=your_account_id_here
DOCUSIGN_PRIVATE_KEY_PATH=./keys/private.key

# For demo environment
DOCUSIGN_AUTH_SERVER=https://account-d.docusign.com
DOCUSIGN_API_BASE_URL=https://demo.docusign.net/restapi
```

**Where to find these values:**
- **Integration Key**: From step 4 above
- **User ID**: DocuSign Admin → My Profile → API Username (GUID format)
- **Account ID**: DocuSign Admin → Account → Account ID

### 6. Start the Backend

```bash
npm run dev
```

Server will start on http://localhost:3001

### 7. Start the Frontend

```bash
cd ../frontend
npm install
npm start
```

Dashboard will open at http://localhost:3000

## 📁 Project Structure

```
docusign-iam-dashboard/
├── backend/
│   ├── server.js                 # Express server
│   ├── services/
│   │   └── docusign.service.js   # DocuSign API integration
│   ├── routes/
│   │   └── docusign.routes.js    # API endpoints
│   ├── middleware/
│   │   ├── cache.middleware.js   # Response caching
│   │   └── error.middleware.js   # Error handling
│   ├── scripts/
│   │   └── setup.js              # Setup automation
│   ├── keys/                     # ❌ GITIGNORED - RSA keys
│   ├── .env                      # ❌ GITIGNORED - Secrets
│   ├── .env.example              # ✅ Template for .env
│   ├── .gitignore                # ✅ Security rules
│   └── package.json
├── frontend/
│   └── src/
│       └── components/
│           └── Dashboard.jsx     # Main dashboard component
├── docs/
│   └── IMPLEMENTATION_GUIDE.md   # Detailed architecture docs
└── README.md
```

## 🔌 API Endpoints

### Workflows

```bash
# Get all workflows with health metrics
GET /api/docusign/workflows

# Get specific workflow details
GET /api/docusign/workflows/:workflowId

# Get workflow instances
GET /api/docusign/workflows/:workflowId/instances

# Get instance execution history
GET /api/docusign/workflows/:workflowId/instances/:instanceId
```

### Health

```bash
# Get overall system health
GET /api/docusign/health
```

### Cache Management

```bash
# Clear cache (admin)
POST /api/docusign/cache/clear
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test DocuSign connection
curl http://localhost:3001/api/docusign/health
```

## 📊 Health Metrics Explained

### Status Indicators

- 🟢 **Healthy** - Completion rate ≥ 95%
- 🟡 **Warning** - Completion rate 85-94%
- 🔴 **Critical** - Completion rate < 85%

### Detected Issues

- **Timeouts** - Approval timeouts exceeding threshold
- **API Failures** - Connection issues with external systems
- **Routing Errors** - Conditional logic or recipient routing failures
- **Expiration** - Envelopes expiring before completion

### Recommendations

Priority levels:
- **Critical** - Immediate action required
- **High** - Address soon
- **Medium** - Optimize when possible

## 🔧 Configuration

### Cache Settings

Adjust cache TTL in `.env`:

```bash
CACHE_TTL=120  # seconds
```

### Rate Limiting

Configure in `.env`:

```bash
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100       # per window
```

## 🚀 Production Deployment

### Environment Setup

1. **Use Secret Managers:**
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Cloud Secret Manager
   - HashiCorp Vault

2. **Set Production Environment:**
   ```bash
   NODE_ENV=production
   DOCUSIGN_AUTH_SERVER=https://account.docusign.com
   DOCUSIGN_API_BASE_URL=https://na1.docusign.net/restapi
   ```

3. **Use Redis for Caching:**
   ```bash
   REDIS_URL=redis://your-redis-instance:6379
   ```

### Security Checklist

- [ ] All secrets in environment variables or secret manager
- [ ] RSA private key secured (not in repo)
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Logging configured
- [ ] Monitoring and alerts set up

## 📚 Documentation

- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md)
- [DocuSign JWT Authentication](https://developers.docusign.com/platform/auth/jwt/)
- [Maestro API Reference](https://developers.docusign.com/docs/maestro-api/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. **Never commit secrets!**
5. Submit a pull request

## ⚠️ Important Notes

### Before Committing to GitHub

Always verify:
```bash
# Check what will be committed
git status

# Make sure these are NOT in the list:
# - .env
# - keys/private.key
# - Any files with credentials
```

### If You Accidentally Commit Secrets

1. **Immediately rotate all credentials**
2. Generate new RSA key pair
3. Remove secrets from Git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
4. Force push (if safe to do so)

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### "Failed to authenticate with DocuSign"

- Verify Integration Key is correct
- Check User ID format (should be GUID)
- Ensure user consent was granted
- Verify private key path is correct

### "Workflow data not loading"

- Check Account ID is correct
- Verify you have Maestro workflows created
- Check API base URL matches your environment (demo vs production)

### "Cache not working"

- Ensure Redis is running (if using Redis)
- Check REDIS_URL in .env
- Verify cache middleware is in routes

## 📞 Support

For issues related to:
- **Dashboard**: Open a GitHub issue
- **DocuSign API**: Check [Developer Portal](https://developers.docusign.com/)
- **Maestro**: Contact DocuSign Support

---

Made with ❤️ for better IAM workflow monitoring
