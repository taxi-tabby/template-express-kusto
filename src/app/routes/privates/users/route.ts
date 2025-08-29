import { ExpressRouter } from '@lib/expressRouter'
const router = new ExpressRouter();


/**
 * 사용자 처리
 */
router
.CRUD('default', 'user', {
    primaryKey: 'id',
    softDelete: {enabled: true, field: 'deletedAt'},
})

export default router.build();