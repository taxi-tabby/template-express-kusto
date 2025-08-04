import { PrismaClient } from "./client";
import {seedFixedUsers, seedRandomUsers} from './seed.users';
import {seedFixedRoles} from './seed.roles';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 역할 시딩 (사용자 생성 전에 먼저 실행)
    await seedFixedRoles();
    
    // 고정 사용자 생성
    await seedFixedUsers();
    
    // 랜덤 사용자 생성
    await seedRandomUsers(500);
    
    // 통계 출력
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const verifiedUsers = await prisma.user.count({ where: { isVerified: true } });
    const suspendedUsers = await prisma.user.count({ where: { isSuspended: true } });
    
    const totalRoles = await prisma.role.count();
    const activeRoles = await prisma.role.count({ where: { isActive: true } });
    const systemRoles = await prisma.role.count({ where: { isSystem: true } });
    
    const totalUserRoles = await prisma.userRole.count();
    const adminRoleAssignments = await prisma.userRole.count({
        where: {
            role: { name: "admin" }
        }
    });
    const userRoleAssignments = await prisma.userRole.count({
        where: {
            role: { name: "user" }
        }
    });
    
    console.log('📊 Database Statistics:');
    console.log('👥 Users:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Active Users: ${activeUsers}`);
    console.log(`   Verified Users: ${verifiedUsers}`);
    console.log(`   Suspended Users: ${suspendedUsers}`);
    
    console.log('🔑 Roles:');
    console.log(`   Total Roles: ${totalRoles}`);
    console.log(`   Active Roles: ${activeRoles}`);
    console.log(`   System Roles: ${systemRoles}`);
    
    console.log('👤 User-Role Assignments:');
    console.log(`   Total Assignments: ${totalUserRoles}`);
    console.log(`   Admin Role Assignments: ${adminRoleAssignments}`);
    console.log(`   User Role Assignments: ${userRoleAssignments}`);
    
    console.log('🌱 Database seeding completed!');
}

main()
    .then(async () => {
        console.log('🎉 Database seeding process finished successfully');
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Database seeding failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });