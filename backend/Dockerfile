FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client after schema is available
RUN npx prisma generate

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
