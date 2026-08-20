FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the TypeScript code
RUN npx tsc

CMD ["npm", "start"]
