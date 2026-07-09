FROM golang:1.26 AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /bin/url .

FROM gcr.io/distroless/static AS release
COPY --from=build /bin/url /bin/url

ENV DATABASE_PATH=/data/url.db
ENV PORT=3000
VOLUME /data
EXPOSE 3000

ENTRYPOINT ["/bin/url"]
