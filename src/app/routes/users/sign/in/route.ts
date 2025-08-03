import { ExpressRouter } from '@lib/expressRouter';
const router = new ExpressRouter();









/**
 * 관리자 로그인 요청입니다.
 */
router
.WITH('authRateLimiterDefault', {
    repositoryName: 'defaultUser', 
    maxRequests: 3, 
    windowMs: 1*60*1000, 
    message: "로그인 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
})
.WITH('authJwtGuardNoLoginCheck')
.POST_VALIDATED(
    {
        body: {
            email: { type: 'email', required: true },
            password: { type: 'string', required: true }
        }
    },
    {
        200: {
            success: {type: 'boolean', required: true},
            accessToken: { type: 'string', required: true },
            refreshToken: { type: 'string', required: true },
            uuid: { type: 'string', required: false },
        },
        400: {
            error: { type: 'string', required: true }
        },
        500: {
            error: { type: 'string', required: true }
        },
    },
    async (req, res, injected, repo, db) => {
    
        const jwt = injected.authJwtJsonWebToken;                  
        const userRepo = repo.getRepository('defaultUser');   
        const data = req.validatedData;    

        


        let _userInfo: any = null;

        try {
            // 1. 사용자 조회 및 기본 검증
            _userInfo = await userRepo.findByEmail(data.body.email);

            if (!_userInfo) {
                // 로그인 실패 로그 (사용자 없음)
                await userRepo.createAuditLog({
                    userUuid: undefined, // 사용자를 찾을 수 없음
                    action: 'LOGIN',
                    resource: 'authentication',
                    newValues: { 
                        email: data.body.email,
                        result: 'failed',
                        reason: 'user_not_found'
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                res.status(400);
                return {
                    error: '로그인에 실패했습니다'
                }
            }

            // 2. 계정 잠금 상태 확인
            if (await userRepo.isLockedOut(_userInfo.uuid)) {
                await userRepo.createAuditLog({
                    userUuid: _userInfo.uuid,
                    action: 'LOGIN',
                    resource: 'authentication',
                    newValues: { 
                        email: data?.body.email,
                        result: 'failed',
                        reason: 'account_locked'
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                res.status(400);
                return {
                    error: '계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도해주세요.'
                }
            }

            // 3. 비밀번호 검증
            if (!await jwt.verifyPassword(data?.body.password, _userInfo?.passwordHash ?? '')) {
                // 로그인 실패 횟수 증가
                await userRepo.incrementLoginAttempts(_userInfo.uuid);

                await userRepo.createAuditLog({
                    userUuid: _userInfo.uuid,
                    action: 'LOGIN',
                    resource: 'authentication',
                    newValues: { 
                        email: data?.body.email,
                        result: 'failed',
                        reason: 'invalid_password'
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                res.status(400);
                return {
                    error: '로그인에 실패했습니다'
                }
            }

            // 4. 계정 상태 검증
            if (!_userInfo.isActive) {
                await userRepo.createAuditLog({
                    userUuid: _userInfo.uuid,
                    action: 'LOGIN',
                    resource: 'authentication',
                    newValues: { 
                        email: data?.body.email,
                        result: 'failed',
                        reason: 'account_inactive'
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                res.status(400);
                return {
                    error: '사용자가 비활성화되었습니다'
                }
            }

            if (_userInfo.isSuspended) {
                await userRepo.createAuditLog({
                    userUuid: _userInfo.uuid,
                    action: 'LOGIN',
                    resource: 'authentication',
                    newValues: { 
                        email: data?.body.email,
                        result: 'failed',
                        reason: 'account_suspended'
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                res.status(400);
                return {
                    error: '사용자가 정지되었습니다'
                }
            }

            // 5. 역할 정보 조회
            const withRoles = await userRepo.findWithRoles(_userInfo.uuid);

            // 6. JWT 토큰 및 세션 생성
            const accessTokenJti = jwt.generateJti();
            const refreshTokenJti = jwt.generateJti();
            const deviceId = jwt.generateDeviceId(req.get('User-Agent'), req.ip);
            const familyId = jwt.generateFamilyId(_userInfo.uuid, deviceId);

            // 토큰 페이로드 생성 (현재 JWT 버전 포함)
            const tokenPayload = {
                userId: String(_userInfo.id),
                uuid: _userInfo.uuid.toString(),
                email: _userInfo.email,
                role: withRoles?.roles.map((userRole: any) => userRole.role.uuid) ?? [],
                jwtVersion: _userInfo.jwtVersion || 1 // 사용자의 현재 JWT 버전
            };

            // 액세스 토큰 생성
            const accessToken = jwt.generateAccessToken(tokenPayload, accessTokenJti);
            
            // 리프레시 토큰 생성
            const refreshToken = jwt.generateRefreshToken(tokenPayload, refreshTokenJti);

            // 토큰 만료 시간 계산
            const accessTokenExpiration = jwt.getTokenExpiration(accessToken);
            const refreshTokenExpiration = jwt.getTokenExpiration(refreshToken);

            if (!accessTokenExpiration || !refreshTokenExpiration) {
                throw new Error('토큰 만료 시간을 계산할 수 없습니다');
            }

            // 7. 데이터베이스에 세션 및 리프레시 토큰 저장
            await Promise.all([
                // 세션 생성
                userRepo.createSession({
                    userUuid: _userInfo.uuid,
                    jti: accessTokenJti,
                    refreshJti: refreshTokenJti,
                    familyId: familyId,
                    generation: 1,
                    deviceInfo: req.get('User-Agent'),
                    deviceId: deviceId,
                    ipAddress: req.ip,
                    loginMethod: 'PASSWORD',
                    accessTokenExpiresAt: accessTokenExpiration,
                    refreshTokenExpiresAt: refreshTokenExpiration,
                    expiresAt: refreshTokenExpiration // 세션은 리프레시 토큰과 함께 만료
                }),

                // 리프레시 토큰 저장
                userRepo.createRefreshToken({
                    userUuid: _userInfo.uuid,
                    jti: refreshTokenJti,
                    familyId: familyId,
                    generation: 1,
                    tokenHash: await jwt.hashToken(refreshToken),
                    deviceInfo: req.get('User-Agent'),
                    deviceId: deviceId,
                    ipAddress: req.ip,
                    expiresAt: refreshTokenExpiration
                }),

                // 사용자 로그인 정보 업데이트
                userRepo.updateLoginInfo(_userInfo.uuid, req.ip),

                // 성공적인 로그인 감사 로그
                userRepo.createAuditLog({
                    userUuid: _userInfo.uuid,
                    action: 'LOGIN',
                    resource: 'authentication',
                    newValues: { 
                        email: data?.body.email,
                        result: 'success',
                        deviceId: deviceId,
                        familyId: familyId,
                        sessionJti: accessTokenJti
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                })
            ]);

            // 8. 응답 반환
            const payload = jwt.verifyAccessToken(accessToken);

            return {
                success: true,
                accessToken,
                refreshToken,
                uuid: payload.uuid
            }

        } catch (error) {
            // 예상치 못한 오류 처리
            console.error('Login error:', error);
            
            // 오류 감사 로그
            await userRepo.createAuditLog({
                userUuid: _userInfo?.uuid || undefined,
                action: 'LOGIN',
                resource: 'authentication',
                newValues: { 
                    email: data?.body.email,
                    result: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            res.status(500);
            return {
                error: '로그인 처리 중 오류가 발생했습니다'
            }
        }
    }
)

export default router.build();
