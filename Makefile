.PHONY: install migrate dev build start hash-password reset-db studio seed

install:
	npm install && npx prisma generate

migrate:
	npx prisma migrate deploy

dev:
	npx tsx server.ts

build:
	npm run build

start:
	NODE_ENV=production node dist/server.js

# Prints an .env-ready line. The $ signs are escaped as \$ because
# Next.js expands $VAR references inside .env values.
hash-password:
	node -e "const bcrypt=require('bcryptjs'); const h=bcrypt.hashSync('$(PASSWORD)', 10); console.log('Paste this line into .env:'); console.log('ADMIN_PASSWORD_HASH=\"' + h.replace(/\\$$/g, '\\\\$$') + '\"')"

reset-db:
	npx prisma migrate reset --force

studio:
	npx prisma studio

seed:
	npx prisma db seed
