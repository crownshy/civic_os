# ---- Base Stage ----
FROM node:22 AS base
WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace manifests and every package manifest first so the install
# layer is cacheable and pnpm can resolve the workspace graph.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/civicos/package.json ./packages/civicos/
COPY packages/admin/package.json ./packages/admin/
COPY packages/report/package.json ./packages/report/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# ---- Build Stage ----
FROM base AS build
ENV NODE_OPTIONS="--max-old-space-size=4096"
WORKDIR /app

# Set placeholder environment variables for build
# These will be overridden at runtime
ENV PUBLIC_CONVERSATION_ID=""
ENV PUBLIC_INVITE_ID=""
ENV PUBLIC_POLIS_URL=""
ENV PUBLIC_POLIS_ID=""

# Copy the rest of the source
COPY . .

# Build only the civic-os SvelteKit app (skip admin/shared)
RUN pnpm --filter civic-os build

# Produce a self-contained deployable: resolves the @civicos/shared
# workspace dependency and installs prod-only deps into the output dir.
RUN pnpm --filter civic-os deploy --prod /prod/civic-os

# pnpm deploy honors the package's .gitignore if one exists. The civicos
# package has none today, but copy the SvelteKit build output in explicitly
# so a future .gitignore can't silently drop it from the prod image.
RUN rm -rf /prod/civic-os/build && cp -r packages/civicos/build /prod/civic-os/build

# ---- Production Stage ----
FROM node:22-slim AS production
ENV NODE_OPTIONS="--max-old-space-size=4096"
WORKDIR /app

COPY --from=build /prod/civic-os ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "build/index.js"]
