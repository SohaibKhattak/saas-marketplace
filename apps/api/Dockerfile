FROM node:20-alpine

RUN apk add --no-cache sudo bash php83 php83-phar php83-iconv php83-mysqli php83-json php83-curl

RUN wget https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

WORKDIR /app

# Copy root workspace files
COPY package*.json ./

# Copy the api workspace package.json so npm knows about its dependencies
COPY apps/api/package*.json ./apps/api/

# Install ALL dependencies including devDependencies (typescript, tsx etc)
RUN npm install --include=dev

# Copy full source code
COPY . .

# Build the api
RUN npm run build --workspace=apps/api

# Remove devDependencies after build
RUN npm prune --omit=dev

EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]