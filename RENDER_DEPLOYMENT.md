# 🚀 Render Deployment Guide

## 📋 **STEP-BY-STEP RENDER DEPLOYMENT**

### **1. Repository Setup**
- Push your code to GitHub
- Connect your GitHub repository to Render

### **2. Create New Web Service**

**Service Configuration:**
- **Name**: `ai-chatbot-platform`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)

### **3. Build & Deploy Settings**

**Build Command:**
```bash
npm ci --only=production && cd frontend && npm ci --only=production && npm run build && cd ../containers/mainCodebase && npm ci --only=production
```

**Start Command:**
```bash
npm start
```

**Root Directory:**
```
/ (leave empty for root)
```

### **4. Environment Variables**

Add these in Render dashboard under "Environment":

#### **Required Variables:**
```env
NODE_ENV=production
PORT=5000
FRONTEND_PORT=3000
DB_PATH=./database/ai_platform.db
GOOGLE_AI_API_KEY=AIzaSyDbzYMmwm3gWw0EPvd1e7zLG5v6bvjkHHE
GOOGLE_DESCRIPTION_API_KEY=AIzaSyCxtQVXb1MtoTB795RkwCE_whmfl2sAZdw
GOOGLE_CSE_API_KEY=AIzaSyC6qg8gIfE6fJ0C1OOtfU-u_NPyDoLB06o
GOOGLE_CSE_CX=c124f61e84ea74b41
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### **Optional Variables:**
```env
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
AZURE_AI_API_KEY=your-azure-key
AZURE_AI_ENDPOINT=your-azure-endpoint
BRAVE_SEARCH_API_KEY=your-brave-key
SERPAPI_KEY=your-serpapi-key
CONTAINER_BASE_PORT=3001
MAX_CONTAINERS=50
SEARCH_PROVIDER=google_cse
MAX_TOTAL_SOURCES=5
LOG_LEVEL=info
```

### **5. Advanced Settings**

**Auto-Deploy:** ✅ Enabled
**Pull Request Previews:** ✅ Enabled (optional)
**Docker Platform:** ✅ Enabled (if using Dockerfile.render)

### **6. Resource Configuration**

**Plan:** Starter (upgrade as needed)
**Memory:** 512MB minimum
**CPU:** 0.5 cores minimum

### **7. Custom Domain (Optional)**

1. Go to "Custom Domains" in your service
2. Add your domain
3. Configure DNS records as instructed

### **8. Environment-Specific Optimizations**

#### **For Production:**
```env
NODE_ENV=production
LOG_LEVEL=warn
MAX_CONTAINERS=100
```

#### **For Staging:**
```env
NODE_ENV=staging
LOG_LEVEL=info
MAX_CONTAINERS=10
```

### **9. Monitoring & Logs**

**Health Check Endpoint:**
```
GET /api/health
```

**Log Access:**
- Go to your service dashboard
- Click "Logs" tab
- View real-time logs

### **10. Troubleshooting**

#### **Common Issues:**

1. **Build Fails:**
   - Check Node.js version (18+)
   - Verify all dependencies are in package.json
   - Check build command syntax

2. **Service Won't Start:**
   - Verify PORT environment variable
   - Check start command
   - Review logs for errors

3. **Database Issues:**
   - Ensure DB_PATH is correct
   - Check file permissions
   - Verify SQLite is available

4. **API Key Issues:**
   - Verify all required API keys are set
   - Check key format and validity
   - Review API quotas

#### **Debug Commands:**
```bash
# Check service status
curl https://your-app.onrender.com/api/health

# Test API endpoints
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

### **11. Performance Optimization**

#### **Render-Specific Optimizations:**
- Use `npm ci` instead of `npm install`
- Enable gzip compression
- Optimize static file serving
- Use CDN for assets (optional)

#### **Environment Variables for Performance:**
```env
NODE_ENV=production
LOG_LEVEL=warn
CACHE_TTL_MS=300000
MAX_TOTAL_SOURCES=5
```

### **12. Security Considerations**

1. **Environment Variables:**
   - Never commit API keys to repository
   - Use Render's secure environment variables
   - Rotate keys regularly

2. **CORS Configuration:**
   - Set proper CORS origins
   - Limit allowed domains

3. **Rate Limiting:**
   - Configure appropriate rate limits
   - Monitor API usage

### **13. Scaling**

#### **Horizontal Scaling:**
- Upgrade to higher plans as needed
- Use Render's auto-scaling features
- Monitor resource usage

#### **Vertical Scaling:**
- Increase memory/CPU allocation
- Optimize container management
- Implement caching strategies

### **14. Backup & Recovery**

#### **Database Backup:**
```bash
# Backup SQLite database
cp database/ai_platform.db backup/ai_platform_$(date +%Y%m%d).db
```

#### **Container Data:**
- Container data is ephemeral
- Implement proper data persistence
- Use external storage for important data

### **15. Deployment Checklist**

- [ ] Repository connected to Render
- [ ] Environment variables configured
- [ ] Build command tested
- [ ] Start command verified
- [ ] Health check endpoint working
- [ ] API keys validated
- [ ] Database accessible
- [ ] Frontend serving correctly
- [ ] WebSocket connections working
- [ ] File uploads functional
- [ ] AI container creation working
- [ ] Search functionality operational
- [ ] Monitoring configured
- [ ] Custom domain set up (if needed)

### **16. Post-Deployment Testing**

```bash
# Test health endpoint
curl https://your-app.onrender.com/api/health

# Test user registration
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# Test AI creation
curl -X POST https://your-app.onrender.com/api/create_ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"TestBot","description":"A test bot","personality":"friendly"}'
```

---

## 🎯 **QUICK DEPLOYMENT SUMMARY**

1. **Connect Repository** → GitHub integration
2. **Configure Service** → Web service, Node.js
3. **Set Environment Variables** → All API keys and config
4. **Deploy** → Automatic deployment on push
5. **Test** → Verify all endpoints work
6. **Monitor** → Set up logging and monitoring

**Your app will be available at:** `https://your-app-name.onrender.com`

---

**🚀 Happy Deploying!**
