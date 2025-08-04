import { ExpressRouter } from '@lib/expressRouter'
const router = new ExpressRouter();


router
.CRUD('default', 'userSecurityEvent', {
    only: ['index', 'show']
})

export default router.build();