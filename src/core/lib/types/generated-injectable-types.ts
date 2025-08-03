// Auto-generated file - DO NOT EDIT MANUALLY
// Source: src/app/injectable/

import AuthCSRFHelperModule from '@app/injectable/auth/csrf/helper.module';
import AuthCSRFMiddlewareModule from '@app/injectable/auth/csrf/middleware.module';
import AuthCSRFReferrerMiddleware from '@app/injectable/auth/csrf/referrer.middleware';
import AuthJWTGuardCheckMiddleware from '@app/injectable/auth/jwt/guard/check.middleware';
import AuthJWTGuardNoLoginCheckMiddleware from '@app/injectable/auth/jwt/guard/noLogin/check.middleware';
import AuthJWTGuardRoleCheckMiddleware from '@app/injectable/auth/jwt/guard/role/check.middleware';
import { AuthTryMiddlewareParams as AuthJWTGuardRoleGuideAuthTryMiddlewareParamsType } from '@app/injectable/auth/jwt/guard/role/guide.middleware.interface';
import AuthJWTJsonWebTokenModule from '@app/injectable/auth/jwt/jsonWebToken.module';
import AuthRateLimiterDefaultMiddleware from '@app/injectable/auth/rateLimiter/default.middleware';
import { RateLimiterOptionMiddlewareParams as AuthRateLimiterOptionRateLimiterOptionMiddlewareParamsType } from '@app/injectable/auth/rateLimiter/option.middleware.interface';
import ConstantDBModule from '@app/injectable/constant/db.module';

// Type definitions
type AuthCSRFHelperModuleType = InstanceType<typeof AuthCSRFHelperModule>;
type AuthCSRFMiddlewareModuleType = InstanceType<typeof AuthCSRFMiddlewareModule>;
type AuthJWTJsonWebTokenModuleType = InstanceType<typeof AuthJWTJsonWebTokenModule>;
type ConstantDBModuleType = InstanceType<typeof ConstantDBModule>;
type AuthCSRFReferrerMiddlewareType = ReturnType<typeof AuthCSRFReferrerMiddleware>;
type AuthJWTGuardCheckMiddlewareType = ReturnType<typeof AuthJWTGuardCheckMiddleware>;
type AuthJWTGuardNoLoginCheckMiddlewareType = ReturnType<typeof AuthJWTGuardNoLoginCheckMiddleware>;
type AuthJWTGuardRoleCheckMiddlewareType = ReturnType<typeof AuthJWTGuardRoleCheckMiddleware>;
type AuthRateLimiterDefaultMiddlewareType = ReturnType<typeof AuthRateLimiterDefaultMiddleware>;
type authJwtGuardRoleGuideMiddlewareParamsType = AuthJWTGuardRoleGuideAuthTryMiddlewareParamsType;
type authRateLimiterOptionMiddlewareParamsType = AuthRateLimiterOptionRateLimiterOptionMiddlewareParamsType;

// Injectable modules interface
export interface Injectable {
  authCsrfHelper: AuthCSRFHelperModuleType;
  authCsrfMiddleware: AuthCSRFMiddlewareModuleType;
  authJwtJsonWebToken: AuthJWTJsonWebTokenModuleType;
  constantDb: ConstantDBModuleType;
}

// Middleware interface
export interface Middleware {
  authCsrfReferrer: AuthCSRFReferrerMiddlewareType;
  authJwtGuardCheck: AuthJWTGuardCheckMiddlewareType;
  authJwtGuardNoLoginCheck: AuthJWTGuardNoLoginCheckMiddlewareType;
  authJwtGuardRoleCheck: AuthJWTGuardRoleCheckMiddlewareType;
  authRateLimiterDefault: AuthRateLimiterDefaultMiddlewareType;
}

// Middleware parameters interface
export interface MiddlewareParams {
  authJwtGuardRoleGuide: authJwtGuardRoleGuideMiddlewareParamsType;
  authRateLimiterOption: authRateLimiterOptionMiddlewareParamsType;
}

// Module registry for dynamic loading
export const MODULE_REGISTRY = {
  'authCsrfHelper': () => import('@app/injectable/auth/csrf/helper.module'),
  'authCsrfMiddleware': () => import('@app/injectable/auth/csrf/middleware.module'),
  'authJwtJsonWebToken': () => import('@app/injectable/auth/jwt/jsonWebToken.module'),
  'constantDb': () => import('@app/injectable/constant/db.module'),
} as const;

// Middleware registry for dynamic loading
export const MIDDLEWARE_REGISTRY = {
  'authCsrfReferrer': () => import('@app/injectable/auth/csrf/referrer.middleware'),
  'authJwtGuardCheck': () => import('@app/injectable/auth/jwt/guard/check.middleware'),
  'authJwtGuardNoLoginCheck': () => import('@app/injectable/auth/jwt/guard/noLogin/check.middleware'),
  'authJwtGuardRoleCheck': () => import('@app/injectable/auth/jwt/guard/role/check.middleware'),
  'authRateLimiterDefault': () => import('@app/injectable/auth/rateLimiter/default.middleware'),
} as const;

// Middleware parameter mapping
export const MIDDLEWARE_PARAM_MAPPING = {
  'authJwtGuardRoleCheck': 'authJwtGuardRoleGuide',
  'authRateLimiterDefault': 'authRateLimiterOption',
} as const;

// Module names type
export type ModuleName = keyof typeof MODULE_REGISTRY;

// Middleware names type
export type MiddlewareName = keyof typeof MIDDLEWARE_REGISTRY;

// Middleware parameter names type
export type MiddlewareParamName = keyof MiddlewareParams;

// Helper type for getting module type by name
export type GetModuleType<T extends ModuleName> = T extends keyof Injectable ? Injectable[T] : never;

// Helper type for getting middleware type by name
export type GetMiddlewareType<T extends MiddlewareName> = T extends keyof Middleware ? Middleware[T] : never;

// Helper type for getting middleware parameter type by name
export type GetMiddlewareParamType<T extends MiddlewareParamName> = T extends keyof MiddlewareParams ? MiddlewareParams[T] : never;
