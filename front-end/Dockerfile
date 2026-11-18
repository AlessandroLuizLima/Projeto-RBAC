FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Valores embutidos no build (o Vite lê VITE_* em tempo de build, não em execução).
ARG VITE_API_URL
ARG VITE_NOME_CAFE
ENV VITE_API_URL=$VITE_API_URL VITE_NOME_CAFE=$VITE_NOME_CAFE
RUN npm run build
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
