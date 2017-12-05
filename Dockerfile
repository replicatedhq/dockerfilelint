FROM node:9.2-alpine

LABEL maintainer="Marc Campbell <marc.e.campbell@gmail.com>"

WORKDIR /dockerfilelint

ENTRYPOINT ["/dockerfilelint/bin/dockerfilelint"]

COPY ./package.json /dockerfilelint/package.json
COPY ./lib /dockerfilelint/lib
COPY ./bin /dockerfilelint/bin
COPY ./yarn.lock /dockerfilelint/yarn.lock

RUN echo "@community http://dl-4.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories &&\
    apk add --no-cache --virtual build-dependencies yarn@community &&\
    yarn --no-progress &&\
    apk del build-dependencies
