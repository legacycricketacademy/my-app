# Deployment Guide

This guide covers deploying the Cricket Academy Management System to Render.com.

## Prerequisites

- Render.com account
- PostgreSQL database (can be provisioned through Render)
- Keycloak instance (can be deployed separately)
- SendGrid account (for email notifications)

## Environment Variables

### Required in Render Dashboard

Set these environment variables in your Render service dashboard:

#### Database
```
DATABASE_URL=postgresql://username:password@host:port/database
```

#### Keycloak Authentication
```
VITE_KEYCLOAK_URL=https://your-keycloak-instance.onrender.com/auth
```

#### Email Service
```
SENDGRID_API_KEY=your_sendgrid_api_key
```

### Already Configured

These are already set in `render.yaml`:

```
APP_ENV=production
AUTH_PROVIDER=keycloak
VITE_API_BASE_URL=/api
VITE_APP_ORIGIN=https://cricket-academy.onrender.com
VITE_AUTH_PROVIDER=keycloak
VITE_KEYCLOAK_REALM=cricket-academy
VITE_KEYCLOAK_CLIENT_ID=cricket-coaching-spa
EMAIL_FROM=noreply@legacycricketacademy.com
EMAIL_REPLY_TO=support@legacycricketacademy.com
CORS_ALLOWED_ORIGINS=https://cricket-academy.onrender.com
CLIENT_URL=https://cricket-academy.onrender.com
```

## Deployment Steps

1. **Connect Repository**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository and branch

2. **Configure Service**
   - **Name**: `cricket-academy`
   - **Environment**: `Node`
   - **Plan**: `Starter` (or higher for production)
   - **Build Command**: `npm run build:prod`
   - **Start Command**: `node dist/index.js`

3. **Set Environment Variables**
   - Add the required environment variables listed above
   - Make sure to set `DATABASE_URL` to your PostgreSQL instance
   - Set `VITE_KEYCLOAK_URL` to your Keycloak instance
   - Add your `SENDGRID_API_KEY`

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - The deployment will be available at `https://cricket-academy.onrender.com`

## Post-Deployment Verification

### Automated Smoke Testing

The easiest way to verify your deployment is to run the automated smoke test:

```bash
# Test production URL
npm run test:smoke:prod

# Or test any URL
BASE_URL=https://your-app.onrender.com npm run test:smoke
```

This will run comprehensive tests including:
- Health and version endpoints
- Homepage accessibility
- Authentication guards
- Static asset loading
- Response time checks

### Manual Verification

#### 1. Health Check
```bash
curl https://cricket-academy.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "authProvider": "keycloak"
}
```

#### 2. Version Check
```bash
curl https://cricket-academy.onrender.com/api/version
```

Expected response:
```json
{
  "appEnv": "production",
  "nodeEnv": "production",
  "authProvider": "keycloak",
  "version": "1.0.0",
  "buildTime": "2024-01-15T10:00:00.000Z",
  "gitSha": "abc123def456",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

#### 3. Application Access
- Open `https://cricket-academy.onrender.com` in your browser
- Verify the application loads correctly
- Test authentication with your Keycloak setup

## Custom Domain (Optional)

To use a custom domain:

1. **Add Domain in Render**
   - Go to your service settings
   - Add your custom domain
   - Follow Render's DNS configuration instructions

2. **Update Environment Variables**
   - Update `VITE_APP_ORIGIN` to your custom domain
   - Update `CORS_ALLOWED_ORIGINS` to include your custom domain
   - Update `CLIENT_URL` to your custom domain

3. **Update Keycloak Configuration**
   - Add your custom domain to Keycloak's allowed origins
   - Update redirect URIs in Keycloak client configuration

## Environment-Specific Deployments

### Staging Environment
Create a separate service for staging:

1. **Create New Service**
   - Use the same repository
   - Set `APP_ENV=staging`
   - Use a different database instance
   - Use staging Keycloak instance

2. **Environment Variables**
   ```
   APP_ENV=staging
   VITE_APP_ORIGIN=https://cricket-academy-staging.onrender.com
   VITE_KEYCLOAK_URL=https://your-staging-keycloak.onrender.com/auth
   CORS_ALLOWED_ORIGINS=https://cricket-academy-staging.onrender.com
   CLIENT_URL=https://cricket-academy-staging.onrender.com
   ```

### Development Environment
For local development, use the development environment:

```bash
npm run dev
```

This uses mock authentication and local database.

## CI/CD Integration

### GitHub Actions

The repository includes automated smoke testing via GitHub Actions:

- **Workflow**: `.github/workflows/smoke-test.yml`
- **Triggers**: Push to main/develop, pull requests, manual dispatch
- **Tests**: Health, version, homepage, auth guards, static assets, performance

To run smoke tests manually:
```bash
# Test local development
npm run test:smoke

# Test production URL
npm run test:smoke:prod

# Test custom URL
BASE_URL=https://your-app.onrender.com npm run test:smoke
```

### Render.com Integration

1. **Automatic Deployments**: Connect your GitHub repository to Render
2. **Environment Variables**: Set all required environment variables in Render dashboard
3. **Health Checks**: Render will automatically monitor your application health
4. **Custom Domain**: Add your domain in Render settings

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all environment variables are set
   - Verify Node.js version compatibility
   - Check build logs for specific errors

2. **Authentication Issues**
   - Verify Keycloak configuration
   - Check CORS settings
   - Ensure redirect URIs are correct

3. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check database accessibility
   - Ensure database is provisioned and running

4. **Email Issues**
   - Verify `SENDGRID_API_KEY` is valid
   - Check email domain configuration
   - Test with SendGrid dashboard

### Logs
- View application logs in Render dashboard
- Check build logs for deployment issues
- Monitor health endpoint for service status

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive environment variables
   - Use Render's secure environment variable storage
   - Rotate API keys regularly

2. **CORS Configuration**
   - Only allow necessary origins
   - Avoid using wildcard (*) in production

3. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups

4. **Authentication**
   - Use strong Keycloak configuration
   - Enable proper session management
   - Regular security updates
