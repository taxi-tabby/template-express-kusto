import { ExpressRouter } from '@lib/expressRouter';
const router = new ExpressRouter();


router
.WITH('authRateLimiterDefault', {
    maxRequests: 1,
    windowMs: 1 * 60 * 1000, // 1분
    message: "이미 회원가입 요청을 하셨습니다. 잠시 후 다시 시도해주세요.",
    repositoryName: 'defaultUser'
})
.WITH('authJwtGuardNoLoginCheck')
.CRUD('default', 'user', {
    only: ['create'],
})



export default router.build();
