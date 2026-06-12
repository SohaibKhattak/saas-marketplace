FROM node:20-alpine

RUN apk add --no-cache sudo bash php83 php83-phar php83-iconv php83-mysqli php83-json php83-curl

RUN wget https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

WORKDIR /app

COPY package*.json ./

# Install ALL dependencies including devDependencies (needed for tsc)
RUN npm install --include=dev

COPY . .

RUN npm run build --workspace=apps/api

# Remove devDependencies after build to keep image lean
RUN npm prune --omit=dev

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]