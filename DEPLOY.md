# Render Deployment Guide

## 🚀 Pre-Deployment Checklist

### ✅ **Code Ready**
- [x] Production build working (`npm run build:prod`)
- [x] All tests passing
- [x] Page Object Model tests implemented
- [x] Admin dashboard features complete
- [x] Parent dashboard features complete
- [x] Authentication flow working
- [x] API endpoints functional

### 🔧 **Environment Variables to Set in Render Dashboard**

#### **Required Variables:**
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Keycloak Authentication
VITE_KEYCLOAK_URL=https://your-keycloak-instance.com

# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key

# Security Secrets
JWT_SECRET=your-production-jwt-secret-min-32-chars
SESSION_SECRET=your-production-session-secret-min-32-chars
```

#### **Optional Variables:**
```bash
# Logging
LOG_LEVEL=info

# Additional Security
CORS_ALLOWED_ORIGINS=https://cricket-academy.onrender.com
```

## 🚀 **Deployment Steps**

### **1. Push to Git Repository**
```bash
git add .
git commit -m "feat: complete admin dashboard features and Page Object Model tests"
git push origin main
```

### **2. Connect to Render**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Use the following settings:
   - **Name**: `cricket-academy`
   - **Environment**: `Node`
   - **Plan**: `Starter` (Free)
   - **Build Command**: `npm run build:prod`
   - **Start Command**: `node dist/index.js`
   - **Health Check Path**: `/api/health`

### **3. Set Environment Variables**
In Render dashboard, go to Environment tab and add:
- `DATABASE_URL` (PostgreSQL connection string)
- `VITE_KEYCLOAK_URL` (Your Keycloak instance URL)
- `SENDGRID_API_KEY` (SendGrid API key)
- `JWT_SECRET` (Generate a secure random string)
- `SESSION_SECRET` (Generate a secure random string)

### **4. Deploy**
- Click "Deploy" in Render dashboard
- Monitor the build logs
- Check health endpoint: `https://cricket-academy.onrender.com/api/health`

## 🔍 **Post-Deployment Verification**

### **Health Checks**
```bash
# Check API health
curl https://cricket-academy.onrender.com/api/health

# Check email status
curl https://cricket-academy.onrender.com/api/email/status
```

### **Test Authentication**
1. Visit: `https://cricket-academy.onrender.com`
2. Should redirect to login page
3. Test admin login: `admin@test.com` / `password123`
4. Test parent login: `parent@test.com` / `password123`

### **Test Admin Features**
- [ ] Admin dashboard loads
- [ ] User management page works
- [ ] Coach management page works
- [ ] Payments management page works
- [ ] Reports page works
- [ ] Admin sessions page accessible

### **Test Parent Features**
- [ ] Parent dashboard loads
- [ ] Schedule page works
- [ ] Player management works
- [ ] Payments page works
- [ ] Account page works

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **Build Fails**
   - Check Node.js version (should be 18+)
   - Verify all dependencies in package.json
   - Check build logs in Render dashboard

2. **App Won't Start**
   - Verify environment variables are set
   - Check start command: `node dist/index.js`
   - Review application logs

3. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check PostgreSQL service is running
   - Ensure database exists

4. **Authentication Issues**
   - Verify VITE_KEYCLOAK_URL is correct
   - Check Keycloak realm and client configuration
   - Ensure CORS settings are correct

5. **Email Service Issues**
   - Verify SENDGRID_API_KEY is valid
   - Check SendGrid account status
   - Review email service logs

## 📊 **Monitoring**

### **Render Dashboard**
- Monitor service health
- Check build logs
- Review deployment history
- Monitor resource usage

### **Application Logs**
- Check Render logs for errors
- Monitor API endpoint responses
- Track user authentication flows

## 🔄 **Updates and Maintenance**

### **Deploying Updates**
1. Make changes locally
2. Test with `npm run build:prod`
3. Commit and push to main branch
4. Render will auto-deploy

### **Database Migrations**
```bash
# Run migrations (if needed)
npm run db:push
```

### **Backup Strategy**
- Regular database backups
- Environment variable documentation
- Code repository backups

## 🎯 **Success Criteria**

- [ ] Application deploys successfully
- [ ] Health endpoint returns 200
- [ ] Admin can log in and access all features
- [ ] Parent can log in and access all features
- [ ] All API endpoints respond correctly
- [ ] Email service is functional
- [ ] Database connections work
- [ ] Authentication flow is secure

## 📞 **Support**

If you encounter issues:
1. Check Render dashboard logs
2. Review application logs
3. Verify environment variables
4. Test locally with production build
5. Check database connectivity
6. Verify external service configurations