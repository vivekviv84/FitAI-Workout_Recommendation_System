const mssql = require('mssql')
const bcrypt = require('bcryptjs')

async function run() {
  const conn = process.env.MSSQL_CONNECTION_STRING
  if (!conn) {
    console.error('MSSQL_CONNECTION_STRING not set')
    process.exit(1)
  }
  const pool = await mssql.connect(conn)
  try {
    const passwordHash = await bcrypt.hash('TestPass123', 10)
    const res = await pool.request()
      .input('username', 'testuser')
      .input('email', 'testuser@example.com')
      .input('password_hash', passwordHash)
      .input('name', 'Seed User')
      .query(`INSERT INTO dbo.users (username, email, password_hash, name) VALUES (@username, @email, @password_hash, @name)`)
    console.log('Inserted test user')
  } finally {
    pool.close()
  }
}

run().catch(err => { console.error(err); process.exit(1) })
