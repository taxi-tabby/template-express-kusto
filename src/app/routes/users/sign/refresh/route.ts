import { ExpressRouter } from '@lib/expressRouter';
const router = new ExpressRouter();









/**
 * JWT 토큰 갱신 요청입니다.
 */
router
    .WITH('authJwtGuardCheck')
    .POST_VALIDATED(
        {
            body: {
                refreshToken: { type: 'string', required: true }
            }
        },
        {
            200: {
                success: { type: 'boolean', required: true },
                id: { type: 'string', required: true },
                attributes: {
                    type: 'object', required: true, properties: {
                        accessToken: { type: 'string', required: true },
                        refreshToken: { type: 'string', required: true },
                        accessTokenExpiresAt: { type: 'string', required: true },
                        refreshTokenExpiresAt: { type: 'string', required: true },
                    }
                }
            },
            400: {
                error: { type: 'string', required: true }
            },
            401: {
                error: { type: 'string', required: true }
            },
            500: {
                error: { type: 'string', required: true }
            }
        },
        async (req, res, injected, repo, db) => {

            const jwt = injected.authJwtJsonWebToken;
            const userRepo = repo.getRepository('defaultUser');

            try {

                if (!req.validatedData?.body) {
                    res.status(400);
                    return {
                        error: '요청 데이터가 올바르지 않습니다'
                    };
                }

                const { refreshToken } = req.validatedData.body;


                // 1. Refresh Token 검증
                let payload;
                try {
                    payload = jwt.verifyRefreshToken(refreshToken);
                } catch (error) {
                    res.status(401);
                    return {
                        error: '유효하지 않거나 만료된 Refresh Token입니다'
                    };
                }

                const { jti: refreshJti, uuid: userUuid } = payload;

                if (!refreshJti || !userUuid) {
                    res.status(401);
                    return {
                        error: 'Refresh Token에 필수 정보가 없습니다'
                    };
                }

                // 2. Refresh Token 블랙리스트 확인
                const isBlacklisted = await userRepo.isTokenBlacklisted(refreshJti);
                if (isBlacklisted) {
                    res.status(401);
                    return {
                        error: 'Refresh Token이 폐기되었습니다'
                    };
                }

                // 3. DB에서 Refresh Token 확인
                const refreshTokenRecord = await userRepo.findRefreshTokenByJti(refreshJti);
                if (!refreshTokenRecord) {
                    res.status(401);
                    return {
                        error: 'Refresh Token을 찾을 수 없습니다'
                    };
                }

                if (refreshTokenRecord.isRevoked) {
                    res.status(401);
                    return {
                        error: 'Refresh Token이 폐기되었습니다'
                    };
                }

                if (refreshTokenRecord.isUsed) {
                    res.status(401);
                    return {
                        error: 'Refresh Token이 이미 사용되었습니다'
                    };
                }

                if (refreshTokenRecord.expiresAt < new Date()) {
                    res.status(401);
                    return {
                        error: 'Refresh Token이 만료되었습니다'
                    };
                }

                // 4. 사용자 정보 확인
                const user = await userRepo.findByUuid(userUuid);
                if (!user) {
                    res.status(401);
                    return {
                        error: '사용자를 찾을 수 없습니다'
                    };
                }

                if (!user.isActive) {
                    res.status(401);
                    return {
                        error: '사용자 계정이 비활성화되었습니다'
                    };
                }

                if (user.isSuspended) {
                    res.status(401);
                    return {
                        error: '사용자 계정이 정지되었습니다'
                    };
                }

                // 5. JWT 버전 확인
                const currentJwtVersion = await userRepo.getUserJwtVersion(userUuid);
                if (payload.jwtVersion && currentJwtVersion && payload.jwtVersion < currentJwtVersion) {
                    res.status(401);
                    return {
                        error: 'JWT 버전이 오래되었습니다. 다시 로그인해주세요'
                    };
                }

                // 6. 새로운 토큰들 생성
                const newAccessJti = jwt.generateJti();
                const newRefreshJti = jwt.generateJti();

                const tokenPayload = {
                    userId: String(user.id),
                    uuid: user.uuid,
                    email: user.email,
                    role: [], // UserBase에 role 속성이 없으므로 빈 배열로 설정
                    jwtVersion: currentJwtVersion || 1
                };

                const newAccessToken = jwt.generateAccessToken(tokenPayload, newAccessJti);
                const newRefreshToken = jwt.generateRefreshToken(tokenPayload, newRefreshJti);

                // 7. 토큰 만료 시간 계산
                const accessTokenExpiration = jwt.getTokenExpiration(newAccessToken);
                const refreshTokenExpiration = jwt.getTokenExpiration(newRefreshToken);

                if (!accessTokenExpiration || !refreshTokenExpiration) {
                    throw new Error('토큰 만료 시간을 계산할 수 없습니다');
                }

                // 8. 기존 토큰들 폐기 및 새 토큰 저장
                // 기존 Refresh Token 폐기
                await userRepo.revokeRefreshToken(refreshJti, 'EXPIRED');

                // parentJti가 있을 때만 기존 Access Token을 블랙리스트에 추가
                if (refreshTokenRecord.parentJti) {
                    await userRepo.addToTokenBlacklist({
                        userUuid: user.uuid,
                        jti: refreshTokenRecord.parentJti,
                        tokenType: 'ACCESS',
                        reason: 'EXPIRED',
                        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15분
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                }

                // 새로운 세션 및 토큰 생성
                await Promise.all([
                    userRepo.createSession({
                        userUuid: user.uuid,
                        jti: newAccessJti,
                        refreshJti: newRefreshJti,
                        familyId: refreshTokenRecord.familyId,
                        generation: refreshTokenRecord.generation + 1,
                        deviceInfo: req.get('User-Agent'),
                        deviceId: refreshTokenRecord.deviceId || undefined, // null을 undefined로 변환
                        ipAddress: req.ip,
                        loginMethod: 'TOKEN_REFRESH',
                        accessTokenExpiresAt: accessTokenExpiration,
                        refreshTokenExpiresAt: refreshTokenExpiration,
                        expiresAt: refreshTokenExpiration
                    }),

                    userRepo.createRefreshToken({
                        userUuid: user.uuid,
                        jti: newRefreshJti,
                        familyId: refreshTokenRecord.familyId,
                        generation: refreshTokenRecord.generation + 1,
                        tokenHash: await jwt.hashToken(newRefreshToken),
                        deviceInfo: req.get('User-Agent'),
                        deviceId: refreshTokenRecord.deviceId || undefined, // null을 undefined로 변환
                        ipAddress: req.ip,
                        expiresAt: refreshTokenExpiration,
                        parentJti: newAccessJti // sessionJti 대신 parentJti 사용
                    })
                ]);

                // 9. 감사 로그 생성
                await userRepo.createAuditLog({
                    userUuid: user.uuid,
                    action: 'TOKEN_REFRESH',
                    resource: 'authentication',
                    newValues: {
                        newAccessJti,
                        newRefreshJti,
                        familyId: refreshTokenRecord.familyId,
                        deviceId: refreshTokenRecord.deviceId,
                        generation: refreshTokenRecord.generation + 1,
                        result: 'success'
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                // 10. 응답 반환
                return {
                    success: true,
                    id: user.uuid,
                    attributes: {
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken,
                        accessTokenExpiresAt: accessTokenExpiration.toISOString(),
                        refreshTokenExpiresAt: refreshTokenExpiration.toISOString(),
                    }
                };

            } catch (error) {
                console.error('토큰 갱신 중 오류 발생:', error);

                // 오류 감사 로그
                try {
                    const { refreshToken } = req.body;
                    if (refreshToken) {
                        const payload = jwt.verifyRefreshToken(refreshToken);
                        if (payload.uuid) {
                            await userRepo.createAuditLog({
                                userUuid: payload.uuid,
                                action: 'TOKEN_REFRESH',
                                resource: 'authentication',
                                newValues: {
                                    result: 'error',
                                    error: error instanceof Error ? error.message : 'Unknown error'
                                },
                                ipAddress: req.ip,
                                userAgent: req.get('User-Agent')
                            });
                        }
                    }
                } catch (auditError) {
                    console.error('감사 로그 생성 실패:', auditError);
                }

                res.status(500);
                return {
                    error: '토큰 갱신 중 오류가 발생했습니다'
                };
            }
        }
    )

export default router.build();
