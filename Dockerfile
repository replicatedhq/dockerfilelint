FROM mhart/alpine-node:5.9.1

MAINTAINER Marc Campbell <marc.e.campbell@gmail.com>

COPY ./package.json /dockerfilelint/package.json
COPY ./lib /dockerfilelint/lib
COPY ./bin /dockerfilelint/bin

WORKDIR /dockerfilelint
RUN npm install

ENTRYPOINT ["/dockerfilelint/bin/dockerfilelint"]
