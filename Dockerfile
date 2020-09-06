FROM node:12

# set a directory for the app
WORKDIR /home/node/app

# npm package config
COPY package*.json ./

# install dependency
RUN npm ci --only=prod

# Copy sources
COPY dist dist

# Run application
CMD [ "npm", "run", "start:prod" ]