import { BaseRepository } from '@lib/baseRepository';
import { 
    UserBase, 
    UserAuth, 
    UserProfile, 
    UserCreateData, 
    UserUpdateData, 
    UserProfileUpdateData,
    UserFilters,
    BulkUpdateData,
    RateLimitInfo,
    RateLimitCreateUpdateData,
    RateLimitResult,
    UserAuditLogData,
    UserAuditLogBase,
    UserAuditLogFilters,
    UserAuditLogWithUser
} from './user.types';

/**
 * User repository for handling user-related database operations
 * Optimized for performance with minimal joins and efficient indexing
 */
export default class UserRepository extends BaseRepository<'default'> {


    protected getDatabaseName(): 'default' {
        return 'default';
    }
    
    private getUserDb() {
        return this.client;
    }
    

    // Core find methods (minimal data, no joins)
    async findById(id: bigint): Promise<UserBase | null> {
        return this.getUserDb().user.findUnique({
            where: { id, deletedAt: null },
            select: {
                id: true,
                uuid: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                isActive: true,
                isVerified: true,
                isSuspended: true,
                createdAt: true,
                updatedAt: true,
                passwordHash: true
            }
        });
    }

    async findByEmail(email: string): Promise<UserBase | null> {
        return this.getUserDb().user.findUnique({
            where: { email, deletedAt: null },
            select: {
                id: true,
                uuid: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                isActive: true,
                isVerified: true,
                isSuspended: true,
                createdAt: true,
                updatedAt: true,
                passwordHash: true
            }
        });
    }

    async findByUuid(uuid: string): Promise<UserBase | null> {
        return this.getUserDb().user.findUnique({
            where: { uuid, deletedAt: null },
            select: {
                id: true,
                uuid: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                isActive: true,
                isVerified: true,
                isSuspended: true,
                createdAt: true,
                updatedAt: true,
                passwordHash: true
            }
        });
    }

    async findByUsername(username: string): Promise<UserBase | null> {
        return this.getUserDb().user.findUnique({
            where: { username, deletedAt: null },
            select: {
                id: true,
                uuid: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                isActive: true,
                isVerified: true,
                isSuspended: true,
                createdAt: true,
                updatedAt: true,
                passwordHash: true
            }
        });
    }

    // Unified identifier method (accepts both bigint ID and string UUID)
    async findByIdentifier(identifier: bigint | string): Promise<UserBase | null> {
        if (typeof identifier === 'bigint') {
            return this.findById(identifier);
        }
        return this.findByUuid(identifier);
    }

    // Separate method for getting user with roles (use only when needed)
    async findWithRoles(uuid: string) {
        return this.getUserDb().user.findUnique({
            where: { uuid, deletedAt: null },
            select: {
                id: true,
                uuid: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                isActive: true,
                isVerified: true,
                roles: {
                    where: { deletedAt: null },
                    select: {
                        role: {
                            select: {
                                id: true,
                                uuid: true,
                                name: true,
                                isActive: true
                            }
                        }
                    }
                }
            }
        });
    }

    // Authentication optimized methods
    async findForAuth(email: string): Promise<UserAuth | null> {
        return this.getUserDb().user.findUnique({
            where: { email, deletedAt: null },
            select: {
                id: true,
                uuid: true,
                email: true,
                passwordHash: true,
                isActive: true,
                isVerified: true,
                isSuspended: true,
                loginAttempts: true,
                lockoutUntil: true,
                twoFactorEnabled: true,
                twoFactorSecret: true
            }
        });
    }    
    async create(data: UserCreateData) {
        return this.getUserDb().user.create({
            data,
            select: {
                id: true,
                uuid: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                createdAt: true
            }
        });
    }

    // Update methods (optimized selects)
    async update(id: bigint, data: UserUpdateData) {
        return this.getUserDb().user.update({
            where: { id, deletedAt: null },
            data: { ...data, updatedAt: new Date() },
            select: {
                id: true,
                uuid: true,
                firstName: true,
                lastName: true,
                username: true,
                updatedAt: true
            }
        });
    }

    async updateByUuid(uuid: string, data: UserUpdateData) {
        return this.getUserDb().user.update({
            where: { uuid, deletedAt: null },
            data: { ...data, updatedAt: new Date() },
            select: {
                id: true,
                uuid: true,
                firstName: true,
                lastName: true,
                username: true,
                updatedAt: true
            }
        });
    }    
    
    // Security methods
    async updatePassword(identifier: bigint | string, passwordHash: string) {
        const where = typeof identifier === 'bigint' 
            ? { id: identifier, deletedAt: null }
            : { uuid: identifier, deletedAt: null };

        return this.getUserDb().user.update({
            where,
            data: { 
                passwordHash,
                updatedAt: new Date()
            },
            select: { id: true, uuid: true, updatedAt: true }
        });
    }

    async updateLoginInfo(identifier: bigint | string, ipAddress?: string) {
        const where = typeof identifier === 'bigint' 
            ? { id: identifier, deletedAt: null }
            : { uuid: identifier, deletedAt: null };

        return this.getUserDb().user.update({
            where,
            data: {
                lastLoginAt: new Date(),
                lastLoginIp: ipAddress,
                loginAttempts: 0,
                lockoutUntil: null
            },
            select: { id: true, uuid: true, lastLoginAt: true }
        });
    }

    async incrementLoginAttempts(identifier: bigint | string) {
        const where = typeof identifier === 'bigint' 
            ? { id: identifier, deletedAt: null }
            : { uuid: identifier, deletedAt: null };

        const user = await this.getUserDb().user.findUnique({
            where,
            select: { id: true, loginAttempts: true }
        });

        if (!user) return null;

        const newAttempts = user.loginAttempts + 1;
        const lockoutUntil = newAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;

        return this.getUserDb().user.update({
            where: { id: user.id },
            data: { loginAttempts: newAttempts, lockoutUntil },
            select: { id: true, loginAttempts: true, lockoutUntil: true }
        });
    }    async softDelete(identifier: bigint | string) {
        const where = typeof identifier === 'bigint' 
            ? { id: identifier, deletedAt: null }
            : { uuid: identifier, deletedAt: null };

        return this.getUserDb().user.update({
            where,
            data: {
                deletedAt: new Date(),
                isActive: false
            },
            select: { id: true, uuid: true, deletedAt: true }
        });
    }

    // List and count methods
    async findMany(filters?: UserFilters, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        
        return this.getUserDb().user.findMany({
            where: { 
                deletedAt: null,
                ...filters
            },
            select: {
                id: true,
                uuid: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                lastLoginAt: true
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
    }

    async findActive(page = 1, limit = 20) {
        return this.findMany({ isActive: true }, page, limit);
    }

    async count(filters?: UserFilters): Promise<number> {
        return this.getUserDb().user.count({
            where: {
                deletedAt: null,
                ...filters
            }
        });
    }

    // Utility methods
    async exists(email: string, excludeId?: bigint): Promise<{ id: bigint } | null> {
        return this.getUserDb().user.findFirst({
            where: {
                email,
                deletedAt: null,
                ...(excludeId && { id: { not: excludeId } })
            },
            select: { id: true }
        });
    }

    async isLockedOut(identifier: bigint | string): Promise<boolean> {
        const where = typeof identifier === 'bigint' 
            ? { id: identifier, deletedAt: null }
            : { uuid: identifier, deletedAt: null };

        const user = await this.getUserDb().user.findUnique({
            where,
            select: { lockoutUntil: true }
        });
        
        return user?.lockoutUntil ? new Date() < user.lockoutUntil : false;
    }

    // Bulk operations for performance
    async bulkUpdate(userIds: bigint[], data: BulkUpdateData) {
        return this.getUserDb().user.updateMany({
            where: {
                id: { in: userIds },
                deletedAt: null
            },
            data: { ...data, updatedAt: new Date() }
        });
    }

    async bulkActivate(userIds: bigint[]) {
        return this.bulkUpdate(userIds, { isActive: true });
    }

    async bulkDeactivate(userIds: bigint[]) {
        return this.bulkUpdate(userIds, { isActive: false });
    }

    // Profile specific methods
    async getProfile(uuid: string): Promise<UserProfile | null> {
        return this.getUserDb().user.findUnique({
            where: { uuid, deletedAt: null },
            select: {
                uuid: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                profileImage: true,
                timezone: true,
                locale: true,
                isVerified: true,
                createdAt: true
            }
        });
    }

    async updateProfile(uuid: string, data: UserProfileUpdateData) {
        return this.getUserDb().user.update({
            where: { uuid, deletedAt: null },
            data: { ...data, updatedAt: new Date() },
            select: {
                uuid: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                timezone: true,
                locale: true,
                updatedAt: true
            }
        });
    }

    // Email verification methods
    async setEmailVerificationToken(uuid: string, token: string) {
        return this.getUserDb().user.update({
            where: { uuid, deletedAt: null },
            data: { 
                emailVerificationToken: token,
                emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                updatedAt: new Date()
            },
            select: { id: true, uuid: true, emailVerificationToken: true }
        });
    }

    async findByEmailVerificationToken(token: string) {
        return this.getUserDb().user.findFirst({
            where: { 
                emailVerificationToken: token,
                emailVerificationExpires: { gt: new Date() },
                deletedAt: null
            },
            select: {
                id: true,
                uuid: true,
                email: true,
                isVerified: true
            }
        });
    }

    async verifyEmail(uuid: string) {
        return this.getUserDb().user.update({
            where: { uuid, deletedAt: null },
            data: { 
                isVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null,
                updatedAt: new Date()
            },
            select: { id: true, uuid: true, isVerified: true }
        });
    }

    // Password reset methods
    async setPasswordResetToken(email: string, token: string) {
        return this.getUserDb().user.update({
            where: { email, deletedAt: null },
            data: { 
                passwordResetToken: token,
                passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                updatedAt: new Date()
            },
            select: { id: true, uuid: true, passwordResetToken: true }
        });
    }

    async findByPasswordResetToken(token: string) {
        return this.getUserDb().user.findFirst({
            where: { 
                passwordResetToken: token,
                passwordResetExpires: { gt: new Date() },
                deletedAt: null
            },
            select: {
                id: true,
                uuid: true,
                email: true
            }
        });
    }

    async clearPasswordResetToken(uuid: string) {
        return this.getUserDb().user.update({
            where: { uuid, deletedAt: null },
            data: { 
                passwordResetToken: null,
                passwordResetExpires: null,
                updatedAt: new Date()
            },
            select: { id: true, uuid: true }
        });
    }

    // Analytics and monitoring methods
    async getUserStats(dateFrom?: Date, dateTo?: Date) {
        const where: any = { deletedAt: null };
        
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = dateFrom;
            if (dateTo) where.createdAt.lte = dateTo;
        }

        const [total, active, verified, suspended] = await Promise.all([
            this.getUserDb().user.count({ where }),
            this.getUserDb().user.count({ where: { ...where, isActive: true } }),
            this.getUserDb().user.count({ where: { ...where, isVerified: true } }),
            this.getUserDb().user.count({ where: { ...where, isSuspended: true } })
        ]);

        return {
            total,
            active,
            verified,
            suspended,
            unverified: total - verified,
            inactive: total - active
        };
    }

    async getRecentlyActiveUsers(hours = 24, limit = 50) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        
        return this.getUserDb().user.findMany({
            where: {
                deletedAt: null,
                lastLoginAt: { gte: since }
            },
            select: {
                uuid: true,
                email: true,
                firstName: true,
                lastName: true,
                lastLoginAt: true,
                lastLoginIp: true
            },
            orderBy: { lastLoginAt: 'desc' },
            take: limit
        });
    }

    async searchUsers(query: string, limit = 20) {
        return this.getUserDb().user.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                uuid: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                isActive: true,
                isVerified: true,
                createdAt: true
            },
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
    }

    // Cleanup methods for maintenance
    async cleanupExpiredTokens() {
        const now = new Date();
        
        const [emailTokens, passwordTokens] = await Promise.all([
            this.getUserDb().user.updateMany({
                where: {
                    emailVerificationExpires: { lt: now },
                    emailVerificationToken: { not: null }
                },
                data: {
                    emailVerificationToken: null,
                    emailVerificationExpires: null
                }
            }),
            this.getUserDb().user.updateMany({
                where: {
                    passwordResetExpires: { lt: now },
                    passwordResetToken: { not: null }
                },
                data: {
                    passwordResetToken: null,
                    passwordResetExpires: null
                }
            })
        ]);

        return {
            emailTokensCleared: emailTokens.count,
            passwordTokensCleared: passwordTokens.count
        };
    }

    async unlockExpiredAccounts() {
        const now = new Date();
        
        const result = await this.getUserDb().user.updateMany({
            where: {
                lockoutUntil: { lt: now },
                loginAttempts: { gt: 0 }
            },
            data: {
                loginAttempts: 0,
                lockoutUntil: null
            }
        });

        return { unlockedAccounts: result.count };
    }

    // Batch operations for administrative tasks
    async batchProcessUsers(
        userIds: bigint[], 
        operation: 'activate' | 'deactivate' | 'verify' | 'suspend' | 'unsuspend'
    ) {
        const data: any = { updatedAt: new Date() };
        
        switch (operation) {
            case 'activate':
                data.isActive = true;
                break;
            case 'deactivate':
                data.isActive = false;
                break;
            case 'verify':
                data.isVerified = true;
                data.emailVerificationToken = null;
                data.emailVerificationExpires = null;
                break;
            case 'suspend':
                data.isSuspended = true;
                break;
            case 'unsuspend':
                data.isSuspended = false;
                break;
        }

        return this.getUserDb().user.updateMany({
            where: {
                id: { in: userIds },
                deletedAt: null
            },
            data
        });
    }

    // Performance monitoring helpers
    async getSlowLoginUsers(threshold = 5) {
        return this.getUserDb().user.findMany({
            where: {
                deletedAt: null,
                loginAttempts: { gte: threshold },
                lockoutUntil: null
            },
            select: {
                uuid: true,
                email: true,
                loginAttempts: true,
                lastLoginAt: true,
                lastLoginIp: true
            },
            orderBy: { loginAttempts: 'desc' }
        });
    }

    // Export methods for data migration/backup
    async exportUserData(uuid: string) {
        const user = await this.getUserDb().user.findUnique({
            where: { uuid, deletedAt: null },
            include: {
                roles: {
                    where: { deletedAt: null },
                    include: {
                        role: {
                            select: {
                                name: true,
                                description: true
                            }
                        }
                    }
                },
                permissions: {
                    where: { deletedAt: null },
                    include: {
                        permission: {
                            select: {
                                name: true,
                                resource: true,
                                action: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) return null;

        // Remove sensitive data before export
        const { passwordHash, twoFactorSecret, ...safeUserData } = user;
        return safeUserData;
    }

    // Validation helpers
    async validateUserIntegrity(uuid: string) {
        const issues: string[] = [];
        
        const user = await this.getUserDb().user.findUnique({
            where: { uuid },
            select: {
                id: true,
                uuid: true,
                email: true,
                username: true,
                isActive: true,
                isVerified: true,
                isSuspended: true,
                emailVerificationToken: true,
                emailVerificationExpires: true,
                passwordResetToken: true,
                passwordResetExpires: true,
                lockoutUntil: true,
                loginAttempts: true,
                deletedAt: true
            }
        });

        if (!user) {
            issues.push('User not found');
            return { isValid: false, issues };
        }

        // Check for logical inconsistencies
        if (user.deletedAt && user.isActive) {
            issues.push('Deleted user marked as active');
        }

        if (user.isVerified && user.emailVerificationToken) {
            issues.push('Verified user has pending verification token');
        }

        if (user.emailVerificationExpires && user.emailVerificationExpires < new Date() && user.emailVerificationToken) {
            issues.push('Expired email verification token not cleaned up');
        }

        if (user.passwordResetExpires && user.passwordResetExpires < new Date() && user.passwordResetToken) {
            issues.push('Expired password reset token not cleaned up');
        }

        if (user.lockoutUntil && user.lockoutUntil < new Date() && user.loginAttempts > 0) {
            issues.push('Expired lockout not cleared');
        }        
        return {
            isValid: issues.length === 0,
            issues
        };
    }

    async countAll(): Promise<number> {
        return this.getUserDb().user.count({
            where: { deletedAt: null }
        });
    }

    async countActive(): Promise<number> {
        return this.getUserDb().user.count({
            where: { deletedAt: null, isActive: true }
        });
    }

    async countVerified(): Promise<number> {
        return this.getUserDb().user.count({
            where: { deletedAt: null, isVerified: true }
        });
    }

    async countSuspended(): Promise<number> {
        return this.getUserDb().user.count({
            where: { deletedAt: null, isSuspended: true }
        });
    }

    // ########################################
    // Rate Limit 관련 메서드들
    // ########################################
    


    /**
     * 현재 rate limit 상태를 조회합니다
     */
    async getRateLimit(params: RateLimitInfo): Promise<RateLimitResult | null> {
        const client = this.getUserDb();
        
        const whereCondition = {
            userUuid: params.adminUuid || null,
            ipAddress: params.ipAddress,
            endpoint: params.endpoint,
            method: params.method,
            windowStart: params.windowStart
        };

        const rateLimit = await client.userRateLimit.findFirst({
            where: whereCondition,
            select: {
                requestCount: true,
                isBlocked: true,
                blockUntil: true
            }
        });

        if (!rateLimit) {
            return null;
        }

        // 차단 시간이 지났는지 확인
        const now = new Date();
        const isCurrentlyBlocked = rateLimit.isBlocked && 
                                 rateLimit.blockUntil && 
                                 rateLimit.blockUntil > now;

        return {
            requestCount: rateLimit.requestCount,
            isBlocked: isCurrentlyBlocked || false
        };
    }

    /**
     * Rate limit 정보를 생성하거나 업데이트합니다
     */
    async createOrUpdateRateLimit(params: RateLimitCreateUpdateData): Promise<void> {
        const client = this.getUserDb();
        
        const whereCondition = {
            userUuid: params.adminUuid || null,
            ipAddress: params.ipAddress,
            endpoint: params.endpoint,
            method: params.method,
            windowStart: params.windowStart
        };

        // 먼저 기존 레코드를 찾습니다
        const existingRecord = await client.userRateLimit.findFirst({
            where: whereCondition
        });

        if (existingRecord) {
            
            // 업데이트
            await client.userRateLimit.update({
                where: { id: existingRecord.id },
                data: {
                    requestCount: params.requestCount,
                    windowEnd: params.windowEnd,
                    isBlocked: params.isBlocked || false,
                    blockUntil: params.blockUntil,
                    lastRequest: new Date(),
                    updatedAt: new Date()
                }
            });
        } else {
            
            // 생성
            await client.userRateLimit.create({
                data: {
                    userUuid: params.adminUuid || null,
                    ipAddress: params.ipAddress,
                    endpoint: params.endpoint,
                    method: params.method,
                    requestCount: params.requestCount,
                    windowStart: params.windowStart,
                    windowEnd: params.windowEnd,
                    isBlocked: params.isBlocked || false,
                    blockUntil: params.blockUntil,
                    lastRequest: new Date()
                }
            });
        }
    }

    /**
     * 만료된 rate limit 레코드들을 정리합니다
     */
    async cleanupExpiredRateLimits(): Promise<number> {
        const client = this.getUserDb();
        const now = new Date();
        
        const result = await client.userRateLimit.deleteMany({
            where: {
                windowEnd: {
                    lt: now
                },
                isBlocked: false
            }
        });

        return result.count;
    }

    /**
     * 특정 사용자의 모든 rate limit을 초기화합니다
     */
    async resetUserRateLimits(userUuid: string): Promise<number> {
        const client = this.getUserDb();
        
        const result = await client.userRateLimit.deleteMany({
            where: {
                userUuid: userUuid
            }
        });

        return result.count;
    }

    /**
     * 특정 IP의 모든 rate limit을 초기화합니다
     */
    async resetIpRateLimits(ipAddress: string): Promise<number> {
        const client = this.getUserDb();
        
        const result = await client.userRateLimit.deleteMany({
            where: {
                ipAddress: ipAddress
            }
        });

        return result.count;
    }

    // ########################################
    // User Audit Log 관련 메서드들
    // ########################################

    /**
     * 사용자 감사 로그를 생성합니다
     */
    async createAuditLog(data: UserAuditLogData): Promise<void> {
        const client = this.getUserDb();
        
        await client.userAuditLog.create({
            data: {
                userUuid: data.userUuid || null,
                action: data.action as any, // AuditAction enum
                resource: data.resource,
                resourceId: data.resourceId,
                oldValues: data.oldValues,
                newValues: data.newValues,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                metadata: data.metadata
            }
        });
    }

    /**
     * 사용자 감사 로그를 조회합니다 (사용자 정보 포함)
     */
    async getAuditLogs(
        filters?: UserAuditLogFilters, 
        page = 1, 
        limit = 50
    ): Promise<UserAuditLogWithUser[]> {
        const client = this.getUserDb();
        const skip = (page - 1) * limit;
        
        const whereCondition: any = {
            deletedAt: null
        };

        if (filters) {
            if (filters.userUuid) {
                whereCondition.userUuid = filters.userUuid;
            }
            if (filters.action) {
                whereCondition.action = filters.action;
            }
            if (filters.resource) {
                whereCondition.resource = filters.resource;
            }
            if (filters.ipAddress) {
                whereCondition.ipAddress = filters.ipAddress;
            }
            if (filters.dateFrom || filters.dateTo) {
                whereCondition.createdAt = {};
                if (filters.dateFrom) {
                    whereCondition.createdAt.gte = filters.dateFrom;
                }
                if (filters.dateTo) {
                    whereCondition.createdAt.lte = filters.dateTo;
                }
            }
        }

        return client.userAuditLog.findMany({
            where: whereCondition,
            include: {
                user: {
                    select: {
                        uuid: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        username: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });
    }

    /**
     * 특정 사용자의 감사 로그를 조회합니다
     */
    async getUserAuditLogs(
        userUuid: string, 
        page = 1, 
        limit = 50
    ): Promise<UserAuditLogBase[]> {
        const client = this.getUserDb();
        const skip = (page - 1) * limit;
        
        return client.userAuditLog.findMany({
            where: {
                userUuid: userUuid,
                deletedAt: null
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });
    }

    /**
     * 특정 리소스의 감사 로그를 조회합니다
     */
    async getResourceAuditLogs(
        resource: string, 
        resourceId?: string, 
        page = 1, 
        limit = 50
    ): Promise<UserAuditLogWithUser[]> {
        const client = this.getUserDb();
        const skip = (page - 1) * limit;
        
        const whereCondition: any = {
            resource: resource,
            deletedAt: null
        };

        if (resourceId) {
            whereCondition.resourceId = resourceId;
        }

        return client.userAuditLog.findMany({
            where: whereCondition,
            include: {
                user: {
                    select: {
                        uuid: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        username: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });
    }

    /**
     * 감사 로그 수를 조회합니다
     */
    async countAuditLogs(filters?: UserAuditLogFilters): Promise<number> {
        const client = this.getUserDb();
        
        const whereCondition: any = {
            deletedAt: null
        };

        if (filters) {
            if (filters.userUuid) {
                whereCondition.userUuid = filters.userUuid;
            }
            if (filters.action) {
                whereCondition.action = filters.action;
            }
            if (filters.resource) {
                whereCondition.resource = filters.resource;
            }
            if (filters.ipAddress) {
                whereCondition.ipAddress = filters.ipAddress;
            }
            if (filters.dateFrom || filters.dateTo) {
                whereCondition.createdAt = {};
                if (filters.dateFrom) {
                    whereCondition.createdAt.gte = filters.dateFrom;
                }
                if (filters.dateTo) {
                    whereCondition.createdAt.lte = filters.dateTo;
                }
            }
        }

        return client.userAuditLog.count({
            where: whereCondition
        });
    }

    /**
     * 특정 기간의 사용자 활동 통계를 조회합니다
     */
    async getUserActivityStats(
        dateFrom: Date, 
        dateTo: Date, 
        userUuid?: string
    ): Promise<{ action: string; count: number }[]> {
        const client = this.getUserDb();
        
        const whereCondition: any = {
            deletedAt: null,
            createdAt: {
                gte: dateFrom,
                lte: dateTo
            }
        };

        if (userUuid) {
            whereCondition.userUuid = userUuid;
        }

        const result = await client.userAuditLog.groupBy({
            by: ['action'],
            where: whereCondition,
            _count: {
                action: true
            },
            orderBy: {
                _count: {
                    action: 'desc'
                }
            }
        });

        return result.map(item => ({
            action: item.action,
            count: item._count.action
        }));
    }

    /**
     * 특정 IP 주소의 활동 로그를 조회합니다
     */
    async getIpActivityLogs(
        ipAddress: string, 
        page = 1, 
        limit = 50
    ): Promise<UserAuditLogWithUser[]> {
        const client = this.getUserDb();
        const skip = (page - 1) * limit;
        
        return client.userAuditLog.findMany({
            where: {
                ipAddress: ipAddress,
                deletedAt: null
            },
            include: {
                user: {
                    select: {
                        uuid: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        username: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });
    }

    /**
     * 의심스러운 활동을 탐지합니다 (다수의 실패한 로그인 시도 등)
     */
    async detectSuspiciousActivity(
        hours = 24, 
        failureThreshold = 10
    ): Promise<{ ipAddress: string; count: number; lastAttempt: Date }[]> {
        const client = this.getUserDb();
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        
        // Raw query를 사용하여 복잡한 집계 수행
        const result = await client.$queryRaw<{
            ipAddress: string;
            count: bigint;
            lastAttempt: Date;
        }[]>`
            SELECT 
                ip_address as "ipAddress",
                COUNT(*) as count,
                MAX(created_at) as "lastAttempt"
            FROM user_audit_logs 
            WHERE 
                action = 'FAILED_LOGIN' 
                AND created_at >= ${since}
                AND deleted_at IS NULL
                AND ip_address IS NOT NULL
            GROUP BY ip_address
            HAVING COUNT(*) >= ${failureThreshold}
            ORDER BY COUNT(*) DESC
        `;

        return result.map(item => ({
            ipAddress: item.ipAddress,
            count: Number(item.count),
            lastAttempt: item.lastAttempt
        }));
    }

    /**
     * 오래된 감사 로그를 정리합니다 (보존 정책에 따라)
     */
    async cleanupOldAuditLogs(retentionDays = 365): Promise<number> {
        const client = this.getUserDb();
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        
        const result = await client.userAuditLog.deleteMany({
            where: {
                createdAt: { lt: cutoffDate }
            }
        });

        return result.count;
    }

    /**
     * 감사 로그를 소프트 삭제합니다
     */
    async softDeleteAuditLog(uuid: string): Promise<void> {
        const client = this.getUserDb();
        
        await client.userAuditLog.update({
            where: { uuid },
            data: {
                deletedAt: new Date()
            }
        });
    }

    /**
     * 특정 사용자의 모든 감사 로그를 소프트 삭제합니다 (GDPR 준수 등)
     */
    async softDeleteUserAuditLogs(userUuid: string): Promise<number> {
        const client = this.getUserDb();
        
        const result = await client.userAuditLog.updateMany({
            where: {
                userUuid: userUuid,
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        });

        return result.count;
    }

    // ########################################
    // JWT Session 관련 메서드들
    // ########################################

    /**
     * 새로운 사용자 세션을 생성합니다
     */
    async createSession(data: {
        userUuid: string;
        jti: string;
        refreshJti?: string;
        familyId: string;
        generation?: number;
        deviceInfo?: string;
        deviceId?: string;
        ipAddress?: string;
        location?: string;
        loginMethod?: string;
        accessTokenExpiresAt: Date;
        refreshTokenExpiresAt?: Date;
        expiresAt: Date;
    }) {
        const client = this.getUserDb();
        
        return client.userSession.create({
            data: {
                userUuid: data.userUuid,
                jti: data.jti,
                refreshJti: data.refreshJti,
                familyId: data.familyId,
                generation: data.generation || 1,
                deviceInfo: data.deviceInfo,
                deviceId: data.deviceId,
                ipAddress: data.ipAddress,
                location: data.location,
                loginMethod: data.loginMethod as any,
                accessTokenExpiresAt: data.accessTokenExpiresAt,
                refreshTokenExpiresAt: data.refreshTokenExpiresAt,
                expiresAt: data.expiresAt,
                isActive: true,
                trustScore: 1.0
            },
            select: {
                id: true,
                uuid: true,
                jti: true,
                refreshJti: true,
                familyId: true,
                generation: true,
                createdAt: true
            }
        });
    }

    /**
     * JTI로 세션을 조회합니다
     */
    async findSessionByJti(jti: string) {
        const client = this.getUserDb();
        
        return client.userSession.findUnique({
            where: { 
                jti: jti,
                deletedAt: null 
            },
            select: {
                id: true,
                uuid: true,
                userUuid: true,
                jti: true,
                refreshJti: true,
                familyId: true,
                generation: true,
                deviceId: true,
                isActive: true,
                isCompromised: true,
                expiresAt: true,
                accessTokenExpiresAt: true,
                refreshTokenExpiresAt: true,
                createdAt: true,
                lastUsedAt: true
            }
        });
    }

    /**
     * 사용자의 활성 세션들을 조회합니다
     */
    async findActiveSessionsByUser(userUuid: string) {
        const client = this.getUserDb();
        
        return client.userSession.findMany({
            where: {
                userUuid: userUuid,
                isActive: true,
                expiresAt: { gt: new Date() },
                deletedAt: null
            },
            select: {
                uuid: true,
                jti: true,
                familyId: true,
                deviceInfo: true,
                deviceId: true,
                ipAddress: true,
                location: true,
                loginMethod: true,
                lastUsedAt: true,
                createdAt: true
            },
            orderBy: { lastUsedAt: 'desc' }
        });
    }

    /**
     * 세션을 비활성화합니다 (로그아웃)
     */
    async deactivateSession(jti: string) {
        const client = this.getUserDb();
        
        return client.userSession.update({
            where: { jti: jti },
            data: {
                isActive: false,
                deletedAt: new Date()
            },
            select: {
                id: true,
                uuid: true,
                jti: true
            }
        });
    }

    /**
     * 사용자의 모든 세션을 비활성화합니다
     */
    async deactivateAllUserSessions(userUuid: string) {
        const client = this.getUserDb();
        
        return client.userSession.updateMany({
            where: {
                userUuid: userUuid,
                isActive: true,
                deletedAt: null
            },
            data: {
                isActive: false,
                deletedAt: new Date()
            }
        });
    }

    /**
     * 특정 디바이스의 모든 세션을 비활성화합니다
     */
    async deactivateDeviceSessions(userUuid: string, deviceId: string) {
        const client = this.getUserDb();
        
        return client.userSession.updateMany({
            where: {
                userUuid: userUuid,
                deviceId: deviceId,
                isActive: true,
                deletedAt: null
            },
            data: {
                isActive: false,
                deletedAt: new Date()
            }
        });
    }

    /**
     * 세션을 업데이트합니다 (마지막 사용 시간 등)
     */
    async updateSessionActivity(jti: string, ipAddress?: string) {
        const client = this.getUserDb();
        
        return client.userSession.update({
            where: { jti: jti },
            data: {
                lastUsedAt: new Date(),
                ...(ipAddress && { ipAddress: ipAddress })
            },
            select: {
                id: true,
                lastUsedAt: true
            }
        });
    }

    // ########################################
    // JWT Refresh Token 관련 메서드들
    // ########################################

    /**
     * 새로운 리프레시 토큰을 생성합니다
     */
    async createRefreshToken(data: {
        userUuid: string;
        jti: string;
        familyId: string;
        generation: number;
        tokenHash: string;
        deviceInfo?: string;
        deviceId?: string;
        ipAddress?: string;
        parentJti?: string;
        expiresAt: Date;
    }) {
        const client = this.getUserDb();
        
        return client.userRefreshToken.create({
            data: {
                userUuid: data.userUuid,
                jti: data.jti,
                familyId: data.familyId,
                generation: data.generation,
                tokenHash: data.tokenHash,
                deviceInfo: data.deviceInfo,
                deviceId: data.deviceId,
                ipAddress: data.ipAddress,
                parentJti: data.parentJti,
                expiresAt: data.expiresAt,
                isRevoked: false,
                isUsed: false,
                trustScore: 1.0
            },
            select: {
                id: true,
                uuid: true,
                jti: true,
                familyId: true,
                generation: true,
                createdAt: true
            }
        });
    }

    /**
     * JTI로 리프레시 토큰을 조회합니다
     */
    async findRefreshTokenByJti(jti: string) {
        const client = this.getUserDb();
        
        return client.userRefreshToken.findUnique({
            where: { 
                jti: jti,
                deletedAt: null 
            },
            select: {
                id: true,
                uuid: true,
                userUuid: true,
                jti: true,
                familyId: true,
                generation: true,
                tokenHash: true,
                deviceId: true,
                isRevoked: true,
                isUsed: true,
                expiresAt: true,
                parentJti: true,
                createdAt: true
            }
        });
    }

    /**
     * 토큰 해시로 리프레시 토큰을 조회합니다
     */
    async findRefreshTokenByHash(tokenHash: string) {
        const client = this.getUserDb();
        
        return client.userRefreshToken.findUnique({
            where: { 
                tokenHash: tokenHash,
                deletedAt: null 
            },
            select: {
                id: true,
                uuid: true,
                userUuid: true,
                jti: true,
                familyId: true,
                generation: true,
                deviceId: true,
                isRevoked: true,
                isUsed: true,
                expiresAt: true,
                parentJti: true,
                createdAt: true
            }
        });
    }

    /**
     * 리프레시 토큰을 사용 완료로 표시합니다 (rotation시)
     */
    async markRefreshTokenAsUsed(jti: string) {
        const client = this.getUserDb();
        
        return client.userRefreshToken.update({
            where: { jti: jti },
            data: {
                isUsed: true,
                usedAt: new Date()
            },
            select: {
                id: true,
                jti: true,
                isUsed: true,
                usedAt: true
            }
        });
    }

    /**
     * 리프레시 토큰을 폐기합니다
     */
    async revokeRefreshToken(jti: string, reason?: string, revokedByUserUuid?: bigint) {
        const client = this.getUserDb();
        
        return client.userRefreshToken.update({
            where: { jti: jti },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
                revokedByUserUuid: revokedByUserUuid
            },
            select: {
                id: true,
                jti: true,
                isRevoked: true,
                revokedAt: true
            }
        });
    }

    /**
     * 토큰 패밀리의 모든 리프레시 토큰을 폐기합니다 (도난 감지시)
     */
    async revokeTokenFamily(familyId: string, reason?: string) {
        const client = this.getUserDb();
        
        return client.userRefreshToken.updateMany({
            where: {
                familyId: familyId,
                isRevoked: false,
                deletedAt: null
            },
            data: {
                isRevoked: true,
                revokedAt: new Date()
            }
        });
    }

    /**
     * 사용자의 모든 리프레시 토큰을 폐기합니다
     */
    async revokeAllUserRefreshTokens(userUuid: string) {
        const client = this.getUserDb();
        
        return client.userRefreshToken.updateMany({
            where: {
                userUuid: userUuid,
                isRevoked: false,
                deletedAt: null
            },
            data: {
                isRevoked: true,
                revokedAt: new Date()
            }
        });
    }

    /**
     * 토큰 패밀리의 활성 토큰 수를 확인합니다 (도난 감지용)
     */
    async countActiveTokensInFamily(familyId: string): Promise<number> {
        const client = this.getUserDb();
        
        return client.userRefreshToken.count({
            where: {
                familyId: familyId,
                isRevoked: false,
                isUsed: false,
                expiresAt: { gt: new Date() },
                deletedAt: null
            }
        });
    }

    /**
     * 사용자의 리프레시 토큰 개수를 확인합니다
     */
    async countUserRefreshTokens(userUuid: string): Promise<number> {
        const client = this.getUserDb();
        
        return client.userRefreshToken.count({
            where: {
                userUuid: userUuid,
                isRevoked: false,
                expiresAt: { gt: new Date() },
                deletedAt: null
            }
        });
    }

    /**
     * 만료된 리프레시 토큰들을 정리합니다
     */
    async cleanupExpiredRefreshTokens(): Promise<number> {
        const client = this.getUserDb();
        
        const result = await client.userRefreshToken.updateMany({
            where: {
                expiresAt: { lt: new Date() },
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        });

        return result.count;
    }

    // ########################################
    // JWT Token Blacklist 관련 메서드들
    // ########################################

    /**
     * 토큰을 블랙리스트에 추가합니다
     */
    async addToTokenBlacklist(data: {
        userUuid?: string;
        jti: string;
        tokenType: 'ACCESS' | 'REFRESH' | 'RESET_PASSWORD' | 'EMAIL_VERIFICATION' | 'TWO_FACTOR';
        reason: 'LOGOUT' | 'SECURITY_BREACH' | 'PASSWORD_CHANGE' | 'ADMIN_ACTION' | 'TOKEN_THEFT' | 'EXPIRED' | 'USER_REQUESTED';
        expiresAt: Date;
        ipAddress?: string;
        userAgent?: string;
        deviceInfo?: string;
    }) {
        const client = this.getUserDb();
        
        return client.userTokenBlacklist.create({
            data: {
                userUuid: data.userUuid,
                jti: data.jti,
                tokenType: data.tokenType as any,
                reason: data.reason as any,
                expiresAt: data.expiresAt,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                deviceInfo: data.deviceInfo
            },
            select: {
                id: true,
                uuid: true,
                jti: true,
                tokenType: true,
                reason: true,
                createdAt: true
            }
        });
    }

    /**
     * JTI가 블랙리스트에 있는지 확인합니다
     */
    async isTokenBlacklisted(jti: string): Promise<boolean> {
        const client = this.getUserDb();
        
        const blacklistedToken = await client.userTokenBlacklist.findUnique({
            where: { jti: jti },
            select: { id: true, expiresAt: true }
        });

        if (!blacklistedToken) {
            return false;
        }

        // 만료된 블랙리스트 항목이면 false 반환
        return blacklistedToken.expiresAt > new Date();
    }

    /**
     * 사용자의 모든 토큰을 블랙리스트에 추가합니다
     */
    async blacklistAllUserTokens(
        userUuid: string, 
        reason: 'LOGOUT' | 'SECURITY_BREACH' | 'PASSWORD_CHANGE' | 'ADMIN_ACTION' | 'TOKEN_THEFT' | 'EXPIRED' | 'USER_REQUESTED'
    ) {
        const client = this.getUserDb();
        
        // 활성 세션들의 JTI 조회
        const activeSessions = await client.userSession.findMany({
            where: {
                userUuid: userUuid,
                isActive: true,
                expiresAt: { gt: new Date() },
                deletedAt: null
            },
            select: {
                jti: true,
                refreshJti: true,
                accessTokenExpiresAt: true,
                refreshTokenExpiresAt: true
            }
        });

        const blacklistPromises = [];

        for (const session of activeSessions) {
            // 액세스 토큰 블랙리스트 추가
            blacklistPromises.push(
                client.userTokenBlacklist.create({
                    data: {
                        userUuid: userUuid,
                        jti: session.jti,
                        tokenType: 'ACCESS',
                        reason: reason as any,
                        expiresAt: session.accessTokenExpiresAt
                    }
                })
            );

            // 리프레시 토큰 블랙리스트 추가 (있는 경우)
            if (session.refreshJti && session.refreshTokenExpiresAt) {
                blacklistPromises.push(
                    client.userTokenBlacklist.create({
                        data: {
                            userUuid: userUuid,
                            jti: session.refreshJti,
                            tokenType: 'REFRESH',
                            reason: reason as any,
                            expiresAt: session.refreshTokenExpiresAt
                        }
                    })
                );
            }
        }

        await Promise.all(blacklistPromises);
        return blacklistPromises.length;
    }

    /**
     * 만료된 블랙리스트 항목들을 정리합니다
     */
    async cleanupExpiredBlacklist(): Promise<number> {
        const client = this.getUserDb();
        
        const result = await client.userTokenBlacklist.deleteMany({
            where: {
                expiresAt: { lt: new Date() }
            }
        });

        return result.count;
    }

    /**
     * JWT 버전을 증가시켜 모든 토큰을 무효화합니다
     */
    async incrementJwtVersion(userUuid: string) {
        const client = this.getUserDb();
        
        return client.user.update({
            where: { 
                uuid: userUuid,
                deletedAt: null 
            },
            data: {
                jwtVersion: { increment: 1 },
                updatedAt: new Date()
            },
            select: {
                id: true,
                uuid: true,
                jwtVersion: true,
                updatedAt: true
            }
        });
    }

    /**
     * 사용자의 현재 JWT 버전을 조회합니다
     */
    async getUserJwtVersion(userUuid: string): Promise<number | null> {
        const client = this.getUserDb();
        
        const user = await client.user.findUnique({
            where: { 
                uuid: userUuid,
                deletedAt: null 
            },
            select: { jwtVersion: true }
        });

        return user?.jwtVersion || null;
    }
}
