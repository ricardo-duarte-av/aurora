# Start from a Node + Rust base
FROM rust:1.93.0-slim

# Install Node.js, Yarn, and other necessary dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    python3 \
    python3-pip \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn \
    && apt-get clean

# Set up working directory
WORKDIR /app

# Clone Aurora and install wasm-bindgen
RUN git clone https://github.com/ricardo-duarte-av/aurora/ . \
    && git checkout 'main' \
    && git pull \
    && cargo install wasm-bindgen-cli

# Install JS dependencies
RUN yarn install

# Expose the development server port
EXPOSE 5173

# Start the app (use a script or CMD directly)
CMD ["sh", "-c", "yarn && yarn dev --host 0.0.0.0"]
