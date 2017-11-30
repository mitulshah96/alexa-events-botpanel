FROM node:boron

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . /usr/src/app

RUN npm install pm2 -g
RUN npm install

EXPOSE 4004 4004
CMD ["npm", "run", "start:prod"]