# Multi-stage Dockerfile for building the Aurora web app and serving it with nginx
# - Builds Rust + wasm-bindgen bindings (if present)
# - Installs Node/Yarn, builds the frontend (yarn build)
# - Produces a minimal nginx runtime image serving the build output
# Usage:
#  docker build -t aurora-web .
#  docker run --rm -p 8080:80 aurora-web

########################
## Builder stage
########################
FROM node:18-bullseye AS builder

ENV DEBIAN_FRONTEND=noninteractive
ARG NODE_VERSION=18
ARG BUILD_DIR=dist

# Install system build deps and tools for Rust + wasm builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential git pkg-config libssl-dev ca-certificates wget unzip \
  && rm -rf /var/lib/apt/lists/*

# Install rustup (non-interactive) and add wasm target
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup default stable && rustup target add wasm32-unknown-unknown || true

# Install wasm-bindgen-cli via cargo (locked to prevent unexpected updates)
RUN cargo install wasm-bindgen-cli --locked || true

WORKDIR /app

# Copy package manifests for better layer caching, install JS deps
COPY package.json yarn.lock ./
# Use Corepack / Yarn shipped with Node images; fallback to installing yarn if necessary
RUN corepack enable && corepack prepare yarn@stable --activate || npm install -g yarn

RUN yarn install --frozen-lockfile --network-concurrency 1

# Copy the rest of the repo
COPY . .

# Ensure the bindings script is executable if present and run it.
# The script is allowed to be absent; we continue in that case.
RUN if [ -f ./build-wasm-bindings.sh ]; then chmod +x ./build-wasm-bindings.sh && ./build-wasm-bindings.sh; else echo "No build-wasm-bindings.sh found, skipping bindings step"; fi

# Run the frontend build (adjust if your project uses a different script)
RUN yarn build

########################
## Runtime stage
########################
FROM nginx:alpine AS runtime

ARG BUILD_DIR=dist

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder. Update BUILD_DIR arg if your build uses a different output directory.
COPY --from=builder /app/${BUILD_DIR} /usr/share/nginx/html

# Optional: If you have a custom nginx.conf in the repo, uncomment the following line
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Basic healthcheck to ensure nginx is serving files
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- --timeout=2 http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
