import { PrismaClient } from '@prisma/client'

const databaseUrl = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL)
  : undefined

if (databaseUrl?.hostname.endsWith('.pooler.supabase.com')) {
  databaseUrl.port = '6543'
  databaseUrl.searchParams.set('pgbouncer', 'true')
}

databaseUrl?.searchParams.set('connection_limit', '1')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasourceUrl: databaseUrl?.toString(),
  })

globalForPrisma.prisma = db