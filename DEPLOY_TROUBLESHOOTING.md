# Deploy Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. Database Connection Failures

#### Symptom
```
❌ Database connection failed
⚠️  Using localStorage fallback mode
Login error: TypeError: Cannot read properties of null (reading 'user')
```

#### Causes and Solutions

**A) Special Characters in DATABASE_URL Password**

If your database password contains special characters, they MUST be URL-encoded:

**Common special characters encoding:**
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `^` → `%5E`
- `&` → `%26`
- `*` → `%2A`
- `(` → `%28`
- `)` → `%29`

**Example:**

❌ **WRONG:**
```bash
DATABASE_URL=postgres://privado:privado12!@private_alpdb:5432/privado
```

✅ **CORRECT:**
```bash
DATABASE_URL=postgres://privado:privado12%21@private_alpdb:5432/privado
```

**B) PostgreSQL Service Not Running**

Check if PostgreSQL is accessible:

```bash
# In EasyPanel or your deployment platform
# Check PostgreSQL service logs
docker logs <postgres-container-id>

# Test connection from app container
nc -zv <postgres-host> 5432
# or
telnet <postgres-host> 5432
```

**C) Incorrect Host/Port**

Common EasyPanel configurations:
```bash
# If using EasyPanel managed PostgreSQL
DATABASE_URL=postgresql://user:password@postgres-service:5432/database

# If using external PostgreSQL
DATABASE_URL=postgresql://user:password@external-host:5432/database

# Always use sslmode=disable for internal networks
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=disable
```

---

### 2. Build Errors

#### "Prisma Schema Not Found"

**Solution:** Already fixed in Dockerfile
```dockerfile
# Copy prisma schema BEFORE npm ci
COPY prisma ./prisma
RUN npm ci --ignore-scripts
RUN npx prisma generate
```

#### "Query Engine Not Found"

**Solution:** Already fixed in `prisma/schema.prisma`
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl", "linux-musl-openssl-3.0.x"]
}
```

#### "OpenSSL Library Not Found"

**Solution:** Already fixed - use Alpine 3.19
```dockerfile
FROM node:20-alpine3.19 AS deps
```

---

### 3. Authentication Issues

#### "Email ou senha incorretos" (but credentials are correct)

**Root Cause:** Database not connected, Prisma returns null

**Solution:**
1. Check DATABASE_URL is correctly set in environment
2. Verify special characters are URL-encoded
3. Check PostgreSQL service is running
4. Review application logs for connection errors

**Debug Commands:**
```bash
# Check environment variable is set
echo $DATABASE_URL

# Check Prisma can connect
npx prisma db pull --schema=./prisma/schema.prisma

# Run migrations
npx prisma migrate deploy
```

---

## 📋 Pre-Deployment Checklist

### Environment Variables

Ensure all are set in EasyPanel/deployment platform:

```env
# Database (CRITICAL - URL-encode special chars!)
DATABASE_URL=postgresql://user:password%21@host:5432/database?sslmode=disable

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
PORT=9002

# Authentication (REQUIRED)
JWT_SECRET=your-super-secure-random-string-here-change-me

# Google AI (Genkit)
GEMINI_API_KEY=your-gemini-api-key-here

# Next.js
NEXT_TELEMETRY_DISABLED=1
```

### Database Setup

1. **Create Database:**
```sql
CREATE DATABASE anchorview;
```

2. **Run Migrations:**
```bash
npx prisma migrate deploy
```

3. **Create Superadmin (Optional):**
```bash
node create-superadmin.js
```

---

## 🔍 Debugging Tools

### 1. Check Database Connection

The application now logs detailed connection info:

```
🔌 Initializing Prisma Client...
📍 DATABASE_URL format: postgresql://privado:****@private_alpdb:5432/privado
✅ Database connection successful
```

Or errors:
```
❌ Database connection failed: authentication failed
💡 Check your database credentials (username/password)
```

### 2. Common Error Messages

| Error | Solution |
|-------|----------|
| `authentication failed` | Check username/password, URL-encode special chars |
| `Connection refused` | Check PostgreSQL is running, check host/port |
| `timeout` | Check network connectivity, firewall rules |
| `database "X" does not exist` | Create database or fix DATABASE_URL |
| `role "X" does not exist` | Create PostgreSQL user |

---

## 🚀 EasyPanel Specific Setup

### 1. Create PostgreSQL Service

1. Go to **Services** → **Add Service**
2. Select **PostgreSQL**
3. Configure:
   - **Name:** `postgres-service`
   - **Database:** `anchorview`
   - **Username:** `anchor`
   - **Password:** (use strong password WITHOUT special chars, or URL-encode them)
   - **Version:** PostgreSQL 15

### 2. Link Services

In your app service configuration:
```yaml
services:
  app:
    depends_on:
      - postgres-service
    environment:
      DATABASE_URL: "postgresql://anchor:${DB_PASSWORD}@postgres-service:5432/anchorview?sslmode=disable"
```

### 3. First Deploy

After first successful build:
```bash
# SSH into container
docker exec -it <container-id> sh

# Run migrations
npx prisma migrate deploy

# Create superadmin (optional)
node create-superadmin.js
```

---

## 📞 Support

If issues persist:

1. **Check Application Logs:**
   - Look for `🔌 Initializing Prisma Client...` messages
   - Check for specific error messages

2. **Verify Environment:**
   ```bash
   # Inside container
   echo $DATABASE_URL
   # Should print: postgresql://user:****@host:5432/database
   ```

3. **Test Database Manually:**
   ```bash
   # Install PostgreSQL client
   apk add postgresql-client

   # Test connection
   psql "$DATABASE_URL"
   ```

---

**Created:** 2025-11-04
**Last Updated:** 2025-11-04
