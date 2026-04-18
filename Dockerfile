FROM node:16.15.1

ENV TZ="Asia/Jakarta"
ENV NODE_OPTIONS=--max_old_space_size=10240

RUN apt-get update && apt-get install -yq \
    gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
    libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
    libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
    libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
    libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
    libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
    fonts-liberation libnss3 lsb-release xdg-utils \
    && rm -rf /var/lib/apt/lists/*

RUN npm i -g @nestjs/cli typescript ts-node

COPY package*.json /tmp/app/
RUN cd /tmp/app && npm install --legacy-peer-deps

COPY . /usr/src/app
RUN cp -a /tmp/app/node_modules /usr/src/app
COPY ./wait-for-it.sh /opt/wait-for-it.sh
COPY ./startup.dev.sh /opt/startup.dev.sh

WORKDIR /usr/src/app
RUN npm run build

CMD ["/bin/bash", "/opt/startup.dev.sh"]
