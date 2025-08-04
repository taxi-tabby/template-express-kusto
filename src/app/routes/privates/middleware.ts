import { ExpressRouter } from '@lib/expressRouter'
const router = new ExpressRouter();


/**
 * 비 관리자 접근 차단 미들웨어
 */
router
.WITH('authJwtGuardRoleCheck', {
    requiredRoles: ['admin'],
})
.MIDDLEWARE(function (req, res, next, injected, repo, db) {
    next();
});


export default router.build();