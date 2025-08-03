import { ExpressRouter } from '@lib/expressRouter';
const router = new ExpressRouter();









/**
 * 관리자 로그아웃 요청입니다.
 */
router
.WITH('authJwtGuardCheck')
.POST_VALIDATED(
    {},
    {
        200: {
            success: {type: 'boolean', required: true},
        },
        404: {
            error: { type: 'string', required: true }
        },
    },
    async (req, res, injected, repo, db) => {
    
        const jwt = injected.authJwtJsonWebToken;                  
        const userRepo = repo.getRepository('defaultUser');   


        try {
            // 1. 현재 인증된 사용자 정보 가져오기 (authJwtGuardCheck 미들웨어에서 설정됨)
            
                
            const user = jwt.createAuthenticatedUser((req as any).user);
            const session = jwt.createUserSession((req as any).session);
            const currentJti = (req as any).jti;


            if (!user || !currentJti || !session) {
                res.status(404);
                return {
                    error: '인증 정보를 찾을 수 없습니다'
                }
            }

            // 2. 현재 세션 비활성화
            await userRepo.deactivateSession(currentJti);

            // 3. 토큰을 블랙리스트에 추가
            const accessToken = jwt.extractTokenFromHeader(req.headers.authorization);
            if (accessToken) {
                const tokenExpiration = jwt.getTokenExpiration(accessToken);
                
                if (tokenExpiration) {
                    await userRepo.addToTokenBlacklist({
                        userUuid: user.uuid,
                        jti: currentJti,
                        tokenType: 'ACCESS',
                        reason: 'LOGOUT',
                        expiresAt: tokenExpiration,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                }
                

                // 리프레시 토큰도 블랙리스트에 추가 (있는 경우)
                if (session.refreshJti) {
                    await userRepo.addToTokenBlacklist({
                        userUuid: user.uuid,
                        jti: session.refreshJti,
                        tokenType: 'REFRESH',
                        reason: 'LOGOUT',
                        expiresAt: session.refreshTokenExpiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                }
            }

            // 4. 리프레시 토큰 폐기 (있는 경우)
            if (session.refreshJti) {
                await userRepo.revokeRefreshToken(session.refreshJti, 'LOGOUT');
            }

            // 5. 로그아웃 감사 로그 생성
            await userRepo.createAuditLog({
                userUuid: user.uuid,
                action: 'LOGOUT',
                resource: 'authentication',
                newValues: {
                    sessionJti: currentJti,
                    deviceId: session.deviceId,
                    familyId: session.familyId,
                    result: 'success'
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            return {            
                success: true
            };

        } catch (error) {
            console.error('Logout error:', error);
            
            // 오류 감사 로그
            const user = (req as any).user;
            if (user) {
                await userRepo.createAuditLog({
                    userUuid: user.uuid,
                    action: 'LOGOUT',
                    resource: 'authentication',
                    newValues: {
                        result: 'error',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });
            }

            res.status(500);
            return {
                error: '로그아웃 처리 중 오류가 발생했습니다'
            }
        }
    }
)

export default router.build();
