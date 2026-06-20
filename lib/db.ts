// Conditional DB loader: use MSSQL when MSSQL_CONNECTION_STRING is set, otherwise use bundled SQLite
let db: any

if (process.env.MSSQL_CONNECTION_STRING) {
  // For MSSQL
  const dbModule = require('./db.mssql')
  db = dbModule.default || dbModule
} else {
  // For SQLite - this is a sync module that can be required directly
  const dbModule = require('./db.sqlite')
  db = dbModule.default || dbModule
}

export default db
