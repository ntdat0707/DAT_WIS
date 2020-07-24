# Use *-alpine 
# Alpine Linux is much smaller than most distribution base images, 
# and thus leads to much slimmer images in general.
# For detail: https://github.com/nodejs/docker-node#nodealpine
FROM node:12.18-alpine as builder

# Create app directory

ENV HOME=/builder/app
WORKDIR /builder/app
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

# You would install dependencies for packages that require node-gyp support on the alpine variant:
#  https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md
RUN apk add --no-cache --virtual .gyp python make g++ 

COPY package*.json  yarn.lock  ./

RUN yarn

RUN mkdir -p /prod_dep \
  && cp package.json yarn.lock /prod_dep/ \
  && cd /prod_dep \
  && yarn --prod \
  && cd ${HOME}

COPY . .

RUN yarn run build


#============================== BUILD IMAGE FOR PRODUCTION==========================
FROM node:12.18-alpine as production
ENV HOME=/home/app
WORKDIR /home/app
COPY package*.json ./
COPY yarn.lock .


COPY --from=builder /builder/app/dist/ ./dist/
COPY .env .
COPY ./src ./src
COPY --from=builder /prod_dep/node_modules ./node_modules


EXPOSE 7000
CMD [ "yarn", "js-start-server" ]