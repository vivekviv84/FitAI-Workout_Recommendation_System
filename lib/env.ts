// Environment variable validation
// Validates all required env vars on startup

interface EnvConfig {
  JWT_SECRET: string
  NODE_ENV: 'development' | 'production' | 'test'
  MSSQL_CONNECTION_STRING?: string
}

function validateEnv(): EnvConfig {
  const JWT_SECRET = process.env.JWT_SECRET

  if (!JWT_SECRET) {
    throw new Error('❌ JWT_SECRET environment variable is required')
  }

  if (JWT_SECRET.length < 32) {
    throw new Error('❌ JWT_SECRET must be at least 32 characters long')
  }

  const NODE_ENV = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test'

  if (!['development', 'production', 'test'].includes(NODE_ENV)) {
    throw new Error(`❌ NODE_ENV must be development, production, or test. Got: ${NODE_ENV}`)
  }

  return {
    JWT_SECRET,
    NODE_ENV,
    MSSQL_CONNECTION_STRING: process.env.MSSQL_CONNECTION_STRING,
  }
}

export const env = validateEnv()

if (env.NODE_ENV === 'production') {
  console.log('✅ Environment configuration validated for production')
} else {
  console.log(`✅ Environment configuration validated for ${env.NODE_ENV}`)
}
