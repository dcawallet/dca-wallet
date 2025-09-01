# Etapa 1: Build com Node
FROM node:20-alpine AS builder

WORKDIR /build

COPY dev/ ./
RUN npm install
RUN npm run build

# Etapa 2: Servir com Nginx
FROM nginx:stable-alpine

# Remove a config padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia arquivos gerados no diretório personalizado
COPY --from=builder /build/dist /usr/share/nginx/html

# Config customizado para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
