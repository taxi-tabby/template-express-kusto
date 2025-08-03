import { ExpressRouter } from '@lib/expressRouter';
const router = new ExpressRouter();


router
.WITH('authJwtGuardCheck', {
  requiredRoles: ['user']
})
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
    }
}, async (req, res, injected, repo, db) => {

});


export default router.build();
