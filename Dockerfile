FROM --platform=$BUILDPLATFORM golang:1.27-alpine AS build
ARG TARGETOS
ARG TARGETARCH
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -ldflags="-s -w" -o /bin/url .

FROM gcr.io/distroless/static AS release
COPY --from=build /bin/url /bin/url

ENV DATABASE_PATH=/data/url.db
ENV PORT=3000
VOLUME /data
EXPOSE 3000

ENTRYPOINT ["/bin/url"]
