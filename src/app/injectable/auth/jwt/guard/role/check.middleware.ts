import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../check.middleware'

export default () => {

    /**
     * 권한 확인 미들웨어
     * WITH 메서드에서 전달된 파라미터를 활용할 수 있습니다.
     */
    const authorize = async (req: Request, res: Response, next: NextFunction) => {

        const jwt = req.kusto.injectable.authJwtJsonWebToken;
        const middlewareParams = req.with.authJwtGuardRoleGuide;
        const requiredRoles = middlewareParams?.requiredRoles || [];
        const permissions = middlewareParams?.permissions || undefined;

        const user = jwt.createAuthenticatedUser((req as any).user);

        if (!user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        try {

            // UserRepository 인스턴스 획득
            const userRepo = req.kusto.getRepository('defaultUser');

            // 필요한 역할이 지정된 경우 확인
            if (requiredRoles.length > 0) {
                const roleChecks = await Promise.all(
                    requiredRoles.map((role: string) => userRepo.hasRole(user.uuid, role))
                );
                const hasRequiredRole = roleChecks.some(hasRole => hasRole);

                if (!hasRequiredRole) {
                    return res.status(403).json({
                        error: 'Access denied'
                    });
                }
            }

            // 필요한 권한이 지정된 경우 확인
            if (permissions && permissions.permissionName && permissions.permissionName.length > 0) {
                const permissionChecks = await Promise.all(
                    permissions.permissionName.map((permissionName: string) => 
                        userRepo.hasPermissionByName(user.uuid, permissionName)
                    )
                );
                const hasRequiredPermission = permissionChecks.some(hasPermission => hasPermission);

                if (!hasRequiredPermission) {
                    return res.status(403).json({
                        error: `Permission denied`
                    });
                }
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({ error: 'Internal server error during authorization' });
        }
    };

    return {
        authenticate,
        authorize
    };
};