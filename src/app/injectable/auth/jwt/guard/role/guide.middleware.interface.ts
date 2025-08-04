interface AuthPermissionObject {
    permissionName: string[];
}

export interface AuthTryMiddlewareParams {
    requiredRoles: string[];
    permissions?: AuthPermissionObject;
}