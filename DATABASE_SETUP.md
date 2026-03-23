# Database Setup Guide

## Option 1: Local PostgreSQL Setup

1. Install PostgreSQL on Windows:
   - Download from: https://www.postgresql.org/download/windows/
   - During installation, set password for 'postgres' user
   - Default port is 5432

2. Create the database:
   ```sql
   CREATE DATABASE car_credit_hub;
   ```

3. Update .env file with your PostgreSQL password:
   ```
   DB_PASSWORD=your_actual_postgres_password
   ```

## Option 2: Use Remote Database

If you have remote database credentials, update .env file:
```
DB_HOST=your_remote_host
DB_PORT=your_remote_port
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
```

## Option 3: Use SQLite for Development

For quick development without PostgreSQL setup, we can switch to SQLite.

## Current Status

The server is trying to connect to:
- Host: localhost
- Port: 5432
- Database: car_credit_hub
- User: postgres

Make sure PostgreSQL is running and the database exists, or update the credentials.