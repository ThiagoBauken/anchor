# Install dependencies only when needed
FROM node:20-alpine3.19 AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files and prisma schema
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install dependencies (skip postinstall to avoid migration during build)
RUN npm ci --ignore-scripts

# Generate Prisma Client manually (without running migrations)
RUN npx prisma generate

# Rebuild the source code only when needed
FROM node:20-alpine3.19 AS builder
WORKDIR /app

# Copy dependencies from deps stage (includes Prisma Client)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js app with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PHASE=phase-production-build
ENV SKIP_ENV_VALIDATION=1
RUN npm run build

# Production image, copy all the files and run next
FROM node:20-alpine3.19 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 9002

ENV PORT=9002
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
