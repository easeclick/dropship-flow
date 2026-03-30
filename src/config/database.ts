import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};
