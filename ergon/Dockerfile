# Ergon — image για NAS / server (Synology, QNAP, Unraid, Proxmox, Raspberry Pi 4/5)
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 BUILD_STANDALONE=1 DATA_DIR=/tmp/build-data
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3100 HOSTNAME=0.0.0.0 DATA_DIR=/data TZ=Europe/Athens
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/lib/schema.mjs ./lib/schema.mjs
VOLUME /data
EXPOSE 3100
CMD ["node", "server.js"]
