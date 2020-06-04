FROM node:12-stretch

# Change working directory
WORKDIR "/app"

# Update packages and install dependency packages for services
RUN apt-get update \
 && apt-get dist-upgrade -y \
 && apt-get clean \
 && echo 'Finished installing dependencies'

RUN apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# install xz-utils, to enable unpacking of the tar.xz about to be downloaded
#RUN apt-get install xz-utils

# download the updated version of Node.js to use
## for pre-release nightly builds of Node.js:
RUN wget https://nodejs.org/download/nightly/v14.0.0-nightly20200416b61488fe24/node-v14.0.0-nightly20200416b61488fe24-linux-x64.tar.xz
## for released builds of Node.js use: 
## RUN wget https://nodejs.org/dist/v13.13.0/node-v13.13.0-linux-x64.tar.xz

# before updatibng anything, display the Node.js version currently being used, in the docker build log
#RUN node -v
# unpack/update the Node.js version to use
RUN tar -xJf node-v14.0.0-nightly20200416b61488fe24-linux-x64.tar.xz -C /usr/local --strip-components 1
# display the updated Node.js version now used instead, in the docker build log
#RUN node -v


# Install npm production packages
COPY package.json /app/
RUN cd /app; npm install --production

COPY . /app

ENV NODE_ENV production
ENV PORT 3000

EXPOSE 3000

CMD ["npm", "start"]