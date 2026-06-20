const fs = require('fs')
const mssql = require('mssql')

async function run() {
  const conn = process.env.MSSQL_CONNECTION_STRING
  if (!conn) {
    console.error('MSSQL_CONNECTION_STRING not set')
    process.exit(1)
  }
  const sql = fs.readFileSync('workout/schema/tables.sql', 'utf8')
  const pool = await mssql.connect(conn)
  try {
    await pool.request().batch(sql)
    console.log('Schema published')
  } finally {
    pool.close()
  }
}

run().catch(err => { console.error(err); process.exit(1) })
