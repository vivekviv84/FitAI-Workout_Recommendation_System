import * as mssql from 'mssql'

const pool = new mssql.ConnectionPool(process.env.MSSQL_CONNECTION_STRING || '')
let poolConnect: Promise<mssql.ConnectionPool> | null = null

async function getPool() {
  if (!poolConnect) {
    poolConnect = pool.connect()
  }
  await poolConnect
  return pool
}

// Helper to convert positional ? params to named @p1 .. and return mapping
function convertParams(sqlText: string, params: any[]) {
  let index = 0
  const inputs: { name: string; value: any }[] = []
  const text = sqlText.replace(/\?/g, () => {
    index++
    const name = `p${index}`
    inputs.push({ name, value: params[index - 1] })
    return `@${name}`
  })
  return { text, inputs }
}

function prepare(query: string) {
  return {
    async run(...params: any[]) {
      const pool = await getPool()
      const { text, inputs } = convertParams(query, params)
      // If INSERT, append select scope_identity to return id
      const isInsert = /^\s*INSERT\s+/i.test(text)
      const finalSql = isInsert ? `${text}; SELECT SCOPE_IDENTITY() AS id` : text
      const request = pool.request()
      for (const inp of inputs) {
        request.input(inp.name, inp.value)
      }
      const result = await request.query(finalSql)
      if (isInsert) {
        const id = result.recordset && result.recordset[0] && result.recordset[0].id
        return { lastInsertRowid: id }
      }
      return { changes: result.rowsAffected }
    },
    async get(...params: any[]) {
      const pool = await getPool()
      const { text, inputs } = convertParams(query, params)
      const request = pool.request()
      for (const inp of inputs) request.input(inp.name, inp.value)
      const result = await request.query(text)
      return result.recordset && result.recordset[0]
    },
    async all(...params: any[]) {
      const pool = await getPool()
      const { text, inputs } = convertParams(query, params)
      const request = pool.request()
      for (const inp of inputs) request.input(inp.name, inp.value)
      const result = await request.query(text)
      return result.recordset
    }
  }
}

export default {
  prepare
} as any
