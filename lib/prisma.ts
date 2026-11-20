import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      // pg は既定で平文接続になる。Prisma 6 のエンジン (sslmode=prefer 相当) と同じく
      // TLS で暗号化しつつ、Supabase 独自 CA の証明書検証は行わない。
      ssl: { rejectUnauthorized: false },
    }),
  });

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
