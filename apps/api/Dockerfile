FROM node:20-alpine

# Install system dependencies required for WP-CLI execution scripts
RUN apk add --no-cache sudo bash php81 php81-phar php81-iconv php81-mysqli php81-json php81-curl

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