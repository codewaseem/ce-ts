FROM node:12-alpine

WORKDIR /usr/app


ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1

COPY package.json yarn.lock ./

RUN yarn install


COPY . .

RUN yarn compile

EXPOSE 1338

CMD [ "node", "dist/index.js" ]

