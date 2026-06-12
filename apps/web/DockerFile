FROM node:20-alpine

WORKDIR /app

# Copy root workspace files
COPY package*.json ./

# Copy the web workspace package.json
COPY apps/web/package*.json ./apps/web/

# Install all dependencies including devDependencies (needed for next build)
RUN npm install --include=dev

# Copy full source code
COPY . .

# Build the Next.js app
RUN npm run build --workspace=apps/web

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/web"]