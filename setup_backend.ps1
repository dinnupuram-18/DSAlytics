New-Item -ItemType Directory -Force -Path backend
Set-Location backend
npm init -y
npm install express cors dotenv jsonwebtoken bcrypt
npm install --save-dev typescript @types/node @types/express @types/cors @types/jsonwebtoken @types/bcrypt ts-node nodemon prisma
npx tsc --init
npx prisma init
