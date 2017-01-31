FROM node:7.4.0

MAINTAINER Marc Campbell <marc.e.campbell@gmail.com>

RUN apt-get update && apt-get install --no-install-recommends -y apt-transport-https && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install --no-install-recommends -y yarn && \
    rm -rf /var/lib/apt/lists/*

COPY ./package.json /dockerfilelint/package.json
COPY ./lib /dockerfilelint/lib
COPY ./bin /dockerfilelint/bin

WORKDIR /dockerfilelint
RUN yarn --no-progress

ENTRYPOINT ["/dockerfilelint/bin/dockerfilelint"]
