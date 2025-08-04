
/**
 * JWT 인증 가이드 미들웨어 인터페이스
 * 이 인터페이스는 JWT 인증 미들웨어에서 사용되는 역할과 권한을 정의합니다.
 * 역할 기반 접근 제어(RBAC)를 보다 상세히 구현하기 위한 구조를 제공합니다.
 */
interface AuthPermissionObject {
    permissionName: string[];
}


/**
 * JWT 인증 가이드 미들웨어 파라미터 인터페이스
 */
export interface AuthTryMiddlewareParams {
    requiredRoles: string[];
    permissions?: AuthPermissionObject;
}