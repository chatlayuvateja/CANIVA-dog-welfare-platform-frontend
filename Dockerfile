# ============================================================
# CANIVA frontend - production image
#
# Stage 1: build the React app with Vite
# Stage 2: serve the static build with Nginx
#
# VITE_API_BASE_URL is a BUILD-TIME variable (Vite convention).
# The compose build passes "/", which makes every API call
# same-origin ("/api/..."). The Nginx config then
# reverse-proxies /api/ to the backend container, so the
# browser never talks to another origin (no CORS round-trips).
# ============================================================

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=/
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
