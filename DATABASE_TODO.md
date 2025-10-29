# Database Integration Todo List

## Setup & Configuration

- [ ] Choose and install database ORM/Client (e.g., Prisma, Drizzle, Mongoose) - Recommend Prisma for PostgreSQL or SQLite
- [ ] Create database schema/models (FridgeItem table with id, name, expiryDate, createdAt, updatedAt fields)
- [ ] Set up database connection configuration (environment variables, database client initialization)
- [ ] Set up database migration scripts and initial database setup documentation
- [ ] Add environment variable configuration (.env.local, .env.example) for database connection

## Backend API Development

- [ ] Create API routes for CRUD operations (POST /api/items, GET /api/items, PUT /api/items/[id], DELETE /api/items/[id])
- [ ] Create server actions or API route handlers that interact with the database

## Frontend Integration

- [ ] Set up React Query hooks/mutations to fetch and mutate data from API routes
- [ ] Refactor FridgeItemsManager component to use React Query instead of local state
- [ ] Add loading states and error handling for database operations

## Feature Enhancements

- [ ] Add delete functionality to remove items from the database
- [ ] Add edit/update functionality to modify existing items in the database

## Notes

- React Query (@tanstack/react-query) is already installed
- Current component uses local state - needs to be migrated to database-backed data
- FridgeItem interface: { id: string, name: string, expiryDate: string }
