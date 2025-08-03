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

        const accessToken = jwt.extractTokenFromHeader(req.headers.authorization);

        if (!accessToken) {
            res.status(404);
            return {
                error: '실패'
            }
        }


        // userRepo.user



        
        return {            
            success: true
        };


    }
)

export default router.build();
