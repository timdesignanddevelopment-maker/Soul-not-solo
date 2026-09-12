FROM node:24-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm install

COPY server/ ./
RUN npm run build

EXPOSE 4000

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
