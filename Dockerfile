FROM node:12-alpine

WORKDIR /usr/app


ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1

COPY package.json yarn.lock ./

RUN yarn install
RUN npm install pm2 -g

COPY . .

RUN yarn compile

EXPOSE 1338

CMD [ "pm2-runtime", "dist/index.js" ]

