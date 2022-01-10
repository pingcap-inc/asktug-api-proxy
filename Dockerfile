FROM node:16-alpine

EXPOSE 3000

RUN mkdir -p /home/node/asktug-api-proxy
WORKDIR /home/node/asktug-api-proxy

ADD src src
ADD node_modules node_modules
ADD package.json .
ADD pnpm-lock.yaml .

USER node

CMD ["npm","start"]
