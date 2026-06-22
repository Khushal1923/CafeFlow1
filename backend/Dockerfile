# Stage 1: Build the backend application
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Create a minimal production runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Create folders for uploads and bills to prevent runtime exceptions
RUN mkdir -p public/bills public/uploads

EXPOSE 5000
CMD ["node", "dist/server.js"]

