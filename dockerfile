FROM node:22.17.0-alpine AS dependancies
FROM dependancies AS developer
FROM dependancies AS runner

WORKDIR /app

COPY src/package.json package.json
COPY src/package-lock.json package-lock.json 

RUN npm install

COPY src/ .

CMD ["node", "init"]
