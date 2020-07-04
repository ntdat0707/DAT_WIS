FROM node:10.15.3

# ENV NODE_ENV=development
# ENV NODE_NAME=gateway

ENV APP_PATH /home/node/app
WORKDIR $APP_PATH
COPY . .

RUN ls -a
RUN npm i yarn -g
RUN yarn
# Install dependencies and build whatever you have to build 
# (babel, grunt, webpack, etc.)

RUN yarn build

# Expose ports (for orchestrators and dynamic reverse proxies)
EXPOSE 7000


CMD ["node", "./dist/run/index.js"]
