FROM node:25.2.1-slim

ENV LANG=C.UTF-8
ENV TZ=Asia/Tokyo
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

RUN apt-get update
RUN npm install -g pnpm
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PNPM_HOME}/bin:${PNPM_HOME}:${PATH}"

# -------- run --------
RUN apt-get install -y zsh && chsh -s /usr/bin/zsh root
RUN apt-get install -y curl vim jq

# -------- development --------
RUN apt-get install -y git make
# Node.js
RUN pnpm add -g npm-check-updates
# git-lfs
RUN curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash \
  && apt-get install -y git-lfs \
  && git lfs install
# Claude Code
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV PATH="/root/.local/bin:${PATH}"
# Docker
RUN apt-get install -y ca-certificates gnupg lsb-release \
  && mkdir -m 0755 -p /etc/apt/keyrings \
  && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
  && apt-get update \
  && apt-get install -y docker-ce-cli
