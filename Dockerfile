# Install dependencies only when needed
FROM node:20-slim AS deps
# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# Production image, copy all the files and run next
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/server.js ./

# Expose the port the app runs on
EXPOSE 9002

# Set the command to start the app
CMD ["node", "server.js"]
