# Plopp Frontend — imagen para Docker/despliegue alternativo.
# (En Render se recomienda usar "Static Site" con `npm run build`, no esta imagen.)
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# La URL del backend se inyecta al construir.
# Si usas Docker manualmente: docker build --build-arg VITE_API_URL=https://tu-backend.onrender.com/api .
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
