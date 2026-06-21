FROM node:24-alpine

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install packages
RUN npm install --frozen-lockfile

# Copy source code files
COPY . .

# Compile TypeScript
RUN npm run build

# Expose Node server port
EXPOSE 5000

# Start compiled server
CMD ["npm", "start"]
