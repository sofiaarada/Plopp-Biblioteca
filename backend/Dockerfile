# Plopp Backend — imagen para Render/Docker
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "app.js"]
