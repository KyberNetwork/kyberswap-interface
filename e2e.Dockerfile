# syntax=docker/dockerfile:1
FROM synthetixio/docker-e2e:16.17-ubuntu as base
RUN npm cache clean -f
RUN npm install -g n
RUN n 16.18.1

RUN mkdir /app
WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

FROM base as test
RUN yarn --frozen-lockfile --prefer-offline --no-audit
COPY . .