FROM node:16 as builder

WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:16-alpine

WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]