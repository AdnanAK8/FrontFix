# FrontFix AI — Containerfile (Team B: Frontend Support)
# Clean Node.js LTS container serving API + UI in single process
FROM node:20-alpine

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production \
    PORT=8000 \
    HOST=0.0.0.0

# Copy dependency manifests
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd backend && npm install --omit=dev

# Copy backend source and frontend assets
COPY backend ./backend
COPY frontend ./frontend

EXPOSE 8000

# Health check against Node.js health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8000/ || exit 1

WORKDIR /app/backend

CMD ["node", "src/server.js"]
