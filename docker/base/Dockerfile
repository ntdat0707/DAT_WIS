FROM node:10.15.3
ENV APP_PATH /home/node/app
WORKDIR $APP_PATH
COPY . .

RUN ls -a
RUN npm i yarn -g
RUN yarn
# Install dependencies and build whatever you have to build 
# (babel, grunt, webpack, etc.)

RUN yarn build

CMD ["node", "./dist/run/index.js"]
