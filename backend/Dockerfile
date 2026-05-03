FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src

EXPOSE 4000

CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm start"]
