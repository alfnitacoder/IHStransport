# Development / test database (SQLite)

For local development and testing you can use **SQLite** instead of PostgreSQL. No Docker or PostgreSQL install is required.

## 1. Use SQLite

1. **Create and migrate the SQLite database**

   From the repo root or from `backend`:

   ```bash
   cd backend
   npm run migrate:sqlite
   ```

   This creates `backend/data/development.sqlite` (or the path in `DB_PATH`) and applies the schema plus default admin user and fare config.

2. **Run the backend with SQLite**

   Set `DB_TYPE=sqlite` when starting the server:

   ```bash
   cd backend
   DB_TYPE=sqlite npm run dev
   ```

   Or add to your `.env` (create from `.env.example`):

   ```
   DB_TYPE=sqlite
   DB_PATH=./data/development.sqlite
   ```

   Then start as usual: `npm run dev` or `npm start`.

3. **Default login**

   - Username: `admin`  
   - Password: `admin123`  
   (Same as PostgreSQL migration; change in production.)

## 2. Optional: custom SQLite path

- **DB_PATH** – path to the SQLite file. Default: `backend/data/development.sqlite`.

Example:

```bash
DB_TYPE=sqlite DB_PATH=/tmp/ihs-test.sqlite npm run migrate:sqlite
DB_TYPE=sqlite DB_PATH=/tmp/ihs-test.sqlite npm run dev
```

## 3. Switching back to PostgreSQL

- Omit `DB_TYPE` or set `DB_TYPE=postgres` (or any value other than `sqlite`).
- Ensure `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (and optionally `DB_PORT`) are set for PostgreSQL.
- Run the normal migration: `npm run migrate` (from `backend`).

## 4. Notes

- SQLite is intended for **development and testing** only. Use PostgreSQL in production.
- The same API and app code run against both; the only difference is the database driver and connection config.
- `backend/data/` is in `.gitignore` so the SQLite file is not committed.
