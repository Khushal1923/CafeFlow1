# Stage 1: Build the Next.js application
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Create a minimal runner environment
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built bundles, static assets, and minimal scripts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose Next.js default port
EXPOSE 3000

# Start Next server
CMD ["npm", "start"]
