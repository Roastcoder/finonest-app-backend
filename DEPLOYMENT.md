# 🚀 Deployment Instructions

## Push to GitHub

1. Create a new repository on GitHub: https://github.com/new
   - Name: `car-credit-hub-backend`
   - Description: `Node.js + Express + PostgreSQL backend for Car Credit Hub loan management system`
   - Keep it Public or Private as needed

2. Push the code:

```bash
cd backend
git remote add origin https://github.com/YOUR_USERNAME/car-credit-hub-backend.git
git push -u origin main
```

## Environment Variables

Make sure to set these on your deployment platform:

```env
PORT=5000
DATABASE_URL=postgres://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
```

## Deploy on Coolify

1. Go to your Coolify dashboard
2. Create new application
3. Connect your GitHub repository
4. Set environment variables
5. Coolify will auto-detect the Dockerfile and deploy

## Deploy on Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add

# Deploy
railway up
```

## Deploy on Render

1. Go to https://render.com
2. New > Web Service
3. Connect your GitHub repository
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add environment variables
7. Create PostgreSQL database
8. Deploy

## Deploy on Heroku

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create car-credit-hub-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate

# Seed data
heroku run npm run seed
```

## Local Development

```bash
# Install dependencies
npm install

# Setup database
npm run migrate
npm run seed

# Start server
npm run dev
```

## API Testing

Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

Test login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carcredithub.com","password":"admin123"}'
```

## Database Connection

Your current PostgreSQL connection:
```
postgres://mehar:Mehar%406378110608@187.77.187.120:5431/meh
```

## Support

For issues or questions, contact:
- GitHub: @RoastCoder
- Email: support@standaloncoders.com
