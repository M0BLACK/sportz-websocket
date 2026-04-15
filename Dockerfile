# --- Builder Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Accept the DATABASE_URL build argument
ARG DATABASE_URL

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Generate Prisma Client using the build argument
RUN npx prisma generate


# --- Final Stage ---
FROM node:22-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built application and generated Prisma client from the builder stage
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./.prisma

EXPOSE 8000

CMD ["node", "./src/server.js"]
