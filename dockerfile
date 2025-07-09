FROM node:22.17.0-alpine

COPY package.json ./

RUN npm install --production

COPY . .

EXPOSE 4141

ENV JELLYFIN_HOST="your_jellyfin_host_here"
ENV JELLYFIN_KEY="your_jellyfin_api_key_here"
ENV SKILL_NAME="Jelly Music"
ENV PORT="4141"

CMD ["npm", "start"]
