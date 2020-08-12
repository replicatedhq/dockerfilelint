FROM golang:latest as builder

FROM builder
RUN ls -l /

FROM alpine:latest
CMD ["./app"]