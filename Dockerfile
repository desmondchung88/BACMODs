# syntax=docker/dockerfile:1
# Serves the S1 frontend shell (mock data only) on port 3000.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# No audit here: the pull request guards run it once against the lockfile.
RUN npm ci --no-audit --no-fund

FROM node:24-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG BACMODS_GIT_COMMIT
RUN NEXT_PUBLIC_BACMODS_GIT_COMMIT="$BACMODS_GIT_COMMIT" npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# output: "standalone" bundles only the files the server needs.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
