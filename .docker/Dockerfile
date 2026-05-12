FROM node:25.9.0-slim

ENV LANG=C.UTF-8
ENV TZ=Asia/Tokyo
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

RUN apt-get update
RUN npm install -g pnpm

# -------- run --------
RUN apt-get install -y zsh && chsh -s /usr/bin/zsh root
RUN apt-get install -y curl vim jq

# -------- development --------
RUN apt-get install -y git make
# Node.js
RUN npm install -g npm-check-updates
