FROM node:18

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm install

COPY . /app

RUN npm run build

EXPOSE 4000

USER node

CMD ["node", "build/main"]
