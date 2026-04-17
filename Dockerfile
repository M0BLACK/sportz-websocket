# --- Builder Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Provide a dummy database URL specifically for Prisma generation at build time
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

COPY package*.json ./
RUN npm install

COPY . .


RUN npx prisma generate


# --- Final Stage ---
FROM node:22-alpine

WORKDIR /app
RUN chown node:node /app
USER node

# Copy package files and install only production dependencies
COPY --chown=node:node package*.json ./
RUN npm install --omit=dev

# Copy built application and generated Prisma client from the builder stage
COPY --chown=node:node --from=builder /app/src ./src
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 8000

CMD ["node", "./src/server.js"]
