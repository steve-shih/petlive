FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY webrtc-tree-*.tgz ./
RUN npm ci

# Copy source code
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
