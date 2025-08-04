import { ExpressRouter } from '@lib/expressRouter'
const router = new ExpressRouter();


/**
 * 사용자 처리
 */
router
.CRUD('default', 'user', {

})

export default router.build();