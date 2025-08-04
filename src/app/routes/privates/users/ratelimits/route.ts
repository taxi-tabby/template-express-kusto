import { ExpressRouter } from '@lib/expressRouter'
const router = new ExpressRouter();


router
.CRUD('default', 'userAuditLog', {
    only: ['index', 'show']
})

export default router.build();