FROM node:10.3.0-alpine
LABEL maintainer="Marc Campbell <marc.e.campbell@gmail.com>"

RUN apk --no-cache add yarn

COPY ./package.json /dockerfilelint/package.json
COPY ./lib /dockerfilelint/lib
COPY ./bin /dockerfilelint/bin

WORKDIR /dockerfilelint
RUN yarn --no-progress

ENTRYPOINT ["/dockerfilelint/bin/dockerfilelint"]
