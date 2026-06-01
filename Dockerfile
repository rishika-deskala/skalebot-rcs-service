# ---- Stage 1: Build ----
# Use a Node.js image as the base for the build stage.
# 'alpine' is a lightweight version of Node.js, good for keeping image sizes small.
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies, including development ones needed for the build
RUN npm ci

# Copy the rest of the application's source code
COPY . .

# Build the TypeScript source to JavaScript
RUN npm run build

# ---- Stage 2: Production ----
# Start from a fresh, lightweight Node.js image for the final production image
FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
RUN npm ci --only=production --ignore-scripts

COPY --from=builder /usr/src/app/dist ./dist


# The command to start the application in production
CMD [ "node", "dist/main" ]