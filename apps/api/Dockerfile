FROM node:20-alpine

# Install system dependencies required for WP-CLI execution scripts
RUN apk add --no-cache sudo bash php83 php83-phar php83-iconv php83-mysqli php83-json php83-curl

# Install WP-CLI globally inside the container environment
RUN wget https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

WORKDIR /app

# Install dependencies using monorepo caching rules
COPY package*.json ./
RUN npm install

# Build the TypeScript api application workspace
COPY . .
RUN npm run build --workspace=apps/api

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]