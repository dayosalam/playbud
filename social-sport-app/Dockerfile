FROM node:20-alpine AS build
WORKDIR /app
COPY social-sport-app/package*.json ./
RUN npm install
COPY social-sport-app/ ./
RUN npm run build
FROM nginx:alpine
COPY social-sport-app/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]