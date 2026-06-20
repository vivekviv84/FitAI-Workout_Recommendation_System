# Workout SQL Project

This folder contains a SQL Server Database Project (`workout.sqlproj`) and a set of T-SQL scripts in `schema/tables.sql` converted from the app's current SQLite schema (`lib/db.ts`).

How to publish the schema from VS Code

1. Install the "SQL Server (mssql)" extension and the Microsoft SQL Database Projects extension for VS Code if you don't have them.
2. Open this folder in VS Code. The `.sqlproj` should be recognized as a database project.
3. Use the "Publish" command in the SQL Database Projects extension to deploy to a SQL Server instance or create a DACPAC.

Using the schema locally

- You can run `schema/tables.sql` against a local SQL Server (eg. Developer edition or Docker container) using sqlcmd, Azure Data Studio, or VS Code's SQL extension.

Switching the app to use SQL Server

If you want the Next.js app to use this SQL Server database instead of the included SQLite file:

1. Install an MSSQL client for Node, e.g. `npm install mssql`.
2. Add connection environment variables in your `.env.local` (for example: `MSSQL_CONNECTION_STRING` or `DB_HOST`, `DB_USER`, `DB_PASS`, etc.).
3. Replace `lib/db.ts` with a new `lib/db.mssql.ts` (or update `lib/db.ts`) that uses `mssql` and pools connections. Update imports across the app to point to the new database layer.
4. Update SQL statements in code where necessary (SQLite-specific syntax may need adjustment).
5. Add migration or seed scripts to populate initial data during development.

If you'd like, I can generate a `lib/db.mssql.ts` and update the code to work with MSSQL, including a minimal migration/seed script. Say "switch to mssql" and I'll proceed.
