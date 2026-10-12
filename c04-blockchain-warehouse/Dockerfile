# ---------- build stage ----------
# Node 20: matches the @tsconfig/node20 target and the version used locally.
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Prisma's query engine is dynamically linked against OpenSSL.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Dependencies first so Docker caches this layer across source edits.
COPY package.json package-lock.json ./
RUN npm ci

# Generate the Prisma client. Built on the target machine, so Prisma
# auto-detects linux-arm64-openssl-3.0.x — no binaryTargets entry needed.
COPY prisma ./prisma
RUN npx prisma generate

# tsconfig.build.json excludes __tests__, so dist/ carries no test code.
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build


# ---------- runtime stage ----------
FROM node:20-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# node_modules is copied wholesale rather than reinstalled with --omit=dev.
# It keeps the generated Prisma client and the prisma CLI (needed by
# `migrate deploy` in the entrypoint) without a second resolution pass.
# Costs ~250 MB of image size; buys a build that cannot drift from the one
# that was tested.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist        ./dist
COPY package.json ./
COPY prisma ./prisma

# Groth16 proving/verifying artifacts. Referenced by ZKP_*_PATH.
COPY zkp/build ./zkp/build

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh \
 && mkdir -p uploads \
 && chown -R node:node /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
