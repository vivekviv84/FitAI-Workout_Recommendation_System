declare module 'mssql' {
  export class ConnectionPool {
    constructor(connStr: string)
    connect(): Promise<ConnectionPool>
    request(): any
    close(): Promise<void>
  }

  export function ConnectionPoolFactory(connStr: string): ConnectionPool

  const _default: typeof ConnectionPool
  export default _default
}
