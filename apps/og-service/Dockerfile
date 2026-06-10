# OG + head-injection service. Runs the TypeScript directly via tsx (no separate build step).
# Debian-slim (glibc) so @resvg/resvg-js uses its prebuilt linux-x64-gnu binary (no native toolchain).
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

# The built interface (index.html + prerendered route HTML + kyberswap-og-image.png) must be present
# at /app/static at runtime — config.ts auto-detects it there. Mount it as a volume, or bake it in with
# a build stage, e.g.: COPY --from=<interface-build-stage> .../build /app/static
ENV NODE_ENV=production \
    PUBLIC_BASE=https://kyberswap.com

# Drop root privileges (the node:slim image ships an unprivileged `node` user).
USER node

EXPOSE 8788

# Healthcheck hits the service's /healthz (fixed port 8788).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:8788/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "--import", "tsx", "src/server.ts"]
