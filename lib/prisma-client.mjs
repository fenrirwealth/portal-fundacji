import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
export function utworzKlientaBazy() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 });
  return new PrismaClient({ adapter, log: ["error"] });
}
