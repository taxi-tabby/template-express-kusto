import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../check.middleware'

export default () => {

    /**
     * 권한 확인 미들웨어
     * WITH 메서드에서 전달된 파라미터를 활용할 수 있습니다.
     */
    const authorize = (req: Request, res: Response, next: NextFunction) => {

        const middlewareParams = req.with.authJwtGuardRoleGuide;
        const requiredRoles = middlewareParams?.requiredRoles || [];

        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // 필요한 역할이 지정된 경우 확인
        if (requiredRoles.length > 0) {
            const userRoles = user.roles || [];
            const hasRequiredRole = requiredRoles.some((role: string) => userRoles.includes(role));

            if (!hasRequiredRole) {
                return res.status(403).json({
                    error: `Access denied. Required roles: ${requiredRoles.join(', ')}`
                });
            }
        }

        next();
    };

    return {
        authenticate,
        authorize
    };
};