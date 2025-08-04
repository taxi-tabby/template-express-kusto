import { ExpressRouter } from '@lib/expressRouter'
const router = new ExpressRouter();


router
.CRUD('default', 'permission', {
    
})

export default router.build();