import { ExpressRouter } from '@lib/expressRouter';
const router = new ExpressRouter();


router
.WITH('authJwtGuardCheck')
.GET_VALIDATED({
    
}, {
    200: {
        success: { type: 'boolean', required: true },
        user: {
            type: 'object',
            properties: {
                email: { type: 'email', required: true },
                name: { type: 'string', required: false },
                profileImageUrl: { type: 'string', required: false },
                uuid: { type: 'string', required: true }
            }
        }
    },
    400: {
        error: { type: 'string', required: true }
    },
    500: {
        error: { type: 'string', required: true }
    }   
}, async (req, res, injected, repo, db) => {

    const jwt = injected.authJwtJsonWebToken;
    const constant = injected.constantDb;
    const userRepo = repo.getRepository('defaultUser');

    try {
        const user = jwt.createAuthenticatedUser((req as any).user);
        const uuid = user.uuid = user.uuid || constant.EMPTY_UUID;

        if (!user || !uuid) {
            res.status(400);
            return {
                error: '인증 정보를 찾을 수 없습니다'
            };
        }

        // 사용자 정보 조회
        const userInfo = await userRepo.findByUuid(uuid);
        if (!userInfo) {
            res.status(400);
            return {
                error: '사용자를 찾을 수 없습니다'
            };
        }

        // 사용자 정보 반환
        return {
            success: true,
            user: {
                email: userInfo.email,
                name: userInfo.username || '',
                uuid: userInfo.uuid
            }
        };
        
    } catch(e) {

    }

});


export default router.build();
