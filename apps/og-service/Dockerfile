# OG + head-injection service. Runs the TypeScript directly via tsx (no separate build step).
# Debian-slim (glibc) so @resvg/resvg-js uses its prebuilt linux-x64-gnu binary (no native toolchain).

# Source of the built interface that gets baked into /app/static below — a prebuilt interface image
# whose /var/www IS the interface `build/` output (index.html + prerendered route HTML + og-image).
# Override at build time: --build-arg INTERFACE_IMAGE=asia.gcr.io/kyber-operation/core/kyberswap-interface:<tag>
ARG INTERFACE_IMAGE=asia.gcr.io/kyber-operation/core/kyberswap-interface:latest
FROM ${INTERFACE_IMAGE} AS webdist

FROM node:22-slim

# pnpm via corepack, pinned to match the committed pnpm-lock.yaml.
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# Install only runtime deps, reproducibly. --ignore-workspace: og-service has no workspace deps, so it
# installs standalone from its own lockfile here (the monorepo dev install uses the root lockfile).
# devDeps (typescript/@types/eslint/prettier) aren't installed (--prod); tsx is a runtime dep.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-workspace

COPY tsconfig.json ./
COPY src ./src
# Bundle the Inter TTFs so rendering works offline (FONT_DIR defaults to ./fonts). Without this the
# service would fall back to fetching Google Fonts, which no longer serves the TTF Satori needs.
COPY fonts ./fonts

# Bake the prebuilt interface into /app/static (config.ts auto-detects it there) so the head-injection
# routes /swap, /limit, /pools serve the prerendered HTML. The interface image's /var/www is its build/ output.
COPY --from=webdist /var/www ./static

ENV NODE_ENV=production \
    PUBLIC_BASE=https://kyberswap.com

# Drop root privileges (the node:slim image ships an unprivileged `node` user).
USER node

EXPOSE 8788

# Healthcheck hits the service's /healthz (fixed port 8788).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:8788/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "--import", "tsx", "src/server.ts"]
