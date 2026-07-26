FROM node:24-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/watchdog.db

RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3000

CMD ["node", "--import", "tsx", "src/server.ts"]
