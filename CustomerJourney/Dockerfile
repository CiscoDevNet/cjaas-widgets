FROM node:12

WORKDIR /app
COPY package.json .
RUN yarn
COPY . .
EXPOSE 4200
CMD ["yarn", "start"]