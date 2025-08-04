import { PrismaClient } from "./client";
import {seedFixedUsers, seedRandomUsers} from './seed.users';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting user database seeding...');

    // 고정 사용자 생성
    await seedFixedUsers();
    
    // 랜덤 사용자 생성
    await seedRandomUsers(500);
    
    // 통계 출력
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const verifiedUsers = await prisma.user.count({ where: { isVerified: true } });
    const suspendedUsers = await prisma.user.count({ where: { isSuspended: true } });
    
    console.log('📊 User Statistics:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Active Users: ${activeUsers}`);
    console.log(`   Verified Users: ${verifiedUsers}`);
    console.log(`   Suspended Users: ${suspendedUsers}`);
    
    console.log('🌱 User database seeding completed!');
}

main()
    .then(async () => {
        console.log('🎉 Seeding process finished successfully');
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Seeding failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });