import { PrismaClient } from "./client";

const prisma = new PrismaClient();

// 고정 역할 데이터
const FIXED_ROLES = [
    {
        name: "admin",
        description: "시스템 관리자 - 모든 권한을 가진 최고 관리자 역할",
        isSystem: true,
        isActive: true,
    },
    {
        name: "user",
        description: "일반 사용자 - 기본적인 사용자 권한을 가진 역할",
        isSystem: true,
        isActive: true,
    }
];

/**
 * 고정 역할(Role) 시딩 함수
 * - 시스템 기본 역할들을 생성
 * - admin: 시스템 관리자 역할
 * - user: 일반 사용자 역할
 */
export async function seedFixedRoles() {
    console.log('🔑 Creating fixed roles...');
    
    for (const roleData of FIXED_ROLES) {
        const role = await prisma.role.upsert({
            create: roleData,
            where: { name: roleData.name },
            update: {
                description: roleData.description,
                isActive: roleData.isActive,
            }
        });
        console.log(`✅ Fixed role created/updated: ${role.name} (${role.description})`);
    }
}
