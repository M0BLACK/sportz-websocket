FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

RUN chown -R node:node /app

USER node

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
