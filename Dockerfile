# ---- Base Stage ----
FROM node:22 AS base
WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

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

# Copy all project files
COPY . .

# Build the SvelteKit app
RUN pnpm build

# ---- Production Stage ----
FROM node:22-slim AS production
ENV NODE_OPTIONS="--max-old-space-size=4096"
WORKDIR /app

# Install pnpm globally in the final image
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy built files and only necessary dependencies
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-workspace.yaml ./
COPY --from=build /app/pnpm-lock.yaml ./

COPY --from=build /app/build ./build

RUN pnpm install --prod --frozen-lockfile

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Expose the application port
EXPOSE 3000

# Run the application
CMD ["node", "build/index.js"]
