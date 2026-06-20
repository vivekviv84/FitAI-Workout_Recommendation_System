declare module 'better-sqlite3' {
  class Database {
    constructor(filename: string, options?: any)
    prepare(sql: string): { run: (...args: any[]) => any; get: (...args: any[]) => any; all: (...args: any[]) => any }
    exec(sql: string): any
    close(): void
  }
  export default Database
}
