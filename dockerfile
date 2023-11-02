# Build stage
FROM node:latest AS build
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN rm -rf node_modules
RUN pnpm install
COPY . .
RUN npx prisma generate
RUN pnpm run build

# Run stage
FROM node:latest
WORKDIR /app
RUN npm install -g pnpm
# Copy from build stage
COPY --from=build /app/build ./build
COPY --from=build /app/prisma ./prisma
# Copy package files
COPY package.json pnpm-lock.yaml ./
# Install only production dependencies

RUN pnpm install --prod
# Copy your server.js into the image
COPY server.js ./
# Expose the port the app runs on
EXPOSE 3000
# Start the application using Node.js
CMD ["node", "server.js"]