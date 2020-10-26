FROM node:lts-alpine3.9

# 在容器中创建一个目录
RUN mkdir -p /usr/src/gcp/

WORKDIR /usr/src/gcp/

COPY . /usr/src/gcp/

RUN npm install -g typescript npm-run-all rimraf
RUN npm install

EXPOSE 5050

CMD npm run start
