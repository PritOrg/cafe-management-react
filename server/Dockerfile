# Production image for the API server.
FROM node:20-slim

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies first (better layer caching).
COPY package*.json ./
RUN npm ci --omit=dev

# App source.
COPY . .

EXPOSE 4969
CMD ["node", "index.js"]
