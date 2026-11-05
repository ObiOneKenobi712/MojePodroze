# Obraz frontendu: serwer deweloperski Vite (npm run dev) na porcie 5173.
# Adres backendu dla proxy /api: zmienna API_PROXY_TARGET (ustawiana w docker-compose.yml).

FROM node:24-alpine
WORKDIR /app
# Najpierw tylko lista bibliotek – Docker zapamięta tę warstwę (cache)
# i nie będzie instalował bibliotek od nowa przy każdej zmianie w kodzie.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 5173
# --host 0.0.0.0: Vite przyjmuje połączenia spoza kontenera (z przeglądarki na Windowsie)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
