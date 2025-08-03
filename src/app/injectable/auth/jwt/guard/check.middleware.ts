import { Request, Response, NextFunction } from 'express';


/**
 * JWT 인증 미들웨어 - DB 연동 완전 검증
 * 1. JWT 토큰 파싱 및 서명 검증
 * 2. DB 세션 테이블에서 JTI 확인
 * 3. 토큰 블랙리스트 확인
 * 4. 사용자 JWT 버전 확인
 * 5. 사용자 계정 상태 확인
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Authorization 헤더에서 토큰 추출
        const jwt = req.kusto.injectable.authJwtJsonWebToken;
        const userRepo = req.kusto.getRepository('defaultUser');

        const token = jwt.extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                error: 'Authorization header is missing or invalid'
            });
        }

        // 2. JWT 토큰 검증 (서명, 만료시간 등)
        let payload;
        try {
            payload = jwt.verifyAccessToken(token);
        } catch (error) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }

        const { jti, uuid: userUuid } = payload;

        if (!jti) {
            return res.status(401).json({
                error: 'Token missing required JTI'
            });
        }

        // 3. 토큰 블랙리스트 확인
        const isBlacklisted = await userRepo.isTokenBlacklisted(jti);
        if (isBlacklisted) {
            return res.status(401).json({
                error: 'Token has been revoked'
            });
        }

        // 4. DB에서 활성 세션 확인
        const session = await userRepo.findSessionByJti(jti);
        if (!session) {
            return res.status(401).json({
                error: 'Session not found'
            });
        }

        if (!session.isActive) {
            return res.status(401).json({
                error: 'Session is inactive'
            });
        }

        if (session.expiresAt < new Date()) {
            return res.status(401).json({
                error: 'Session has expired'
            });
        }

        if (session.isCompromised) {
            return res.status(401).json({
                error: 'Session has been compromised'
            });
        }

        // 5. 사용자 정보 확인
        const user = await userRepo.findByUuid(userUuid);
        if (!user) {
            return res.status(401).json({
                error: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                error: 'User account is inactive'
            });
        }

        if (user.isSuspended) {
            return res.status(401).json({
                error: 'User account is suspended'
            });
        }

        // 6. JWT 버전 확인 (보안 사고시 모든 토큰 무효화용)
        const currentJwtVersion = await userRepo.getUserJwtVersion(userUuid);

        // 토큰의 JWT 버전이 현재 사용자의 JWT 버전보다 낮으면 무효화
        if (payload.jwtVersion && currentJwtVersion && payload.jwtVersion < currentJwtVersion) {
            return res.status(401).json({
                error: 'Token version is outdated. Please login again.'
            });
        }

        // 7. 세션 활동 시간 업데이트
        await userRepo.updateSessionActivity(jti, req.ip);

        // 8. 요청 객체에 사용자 정보 추가
        (req as any).user = {
            id: user.id,
            uuid: user.uuid,
            email: user.email,
            isActive: user.isActive,
            isVerified: user.isVerified,
            session: {
                jti: session.jti,
                familyId: session.familyId,
                deviceId: session.deviceId,
                generation: session.generation
            }
        };

        (req as any).session = session;
        (req as any).jti = jti;

        next();

    } catch (error) {
        console.error('JWT authentication error:', error);
        return res.status(500).json({
            error: 'Authentication service error'
        });
    }
};


export default () => {

    /**
     * JWT 인증 미들웨어 - DB 연동 완전 검증
     * 1. JWT 토큰 파싱 및 서명 검증
     * 2. DB 세션 테이블에서 JTI 확인
     * 3. 토큰 블랙리스트 확인
     * 4. 사용자 JWT 버전 확인
     * 5. 사용자 계정 상태 확인
     */

    return {
        authenticate,
    };
};