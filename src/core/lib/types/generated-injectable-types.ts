// Auto-generated file - DO NOT EDIT MANUALLY
// Source: src/app/injectable/

import AuthCSRFHelperModule from '@app/injectable/auth/csrf/helper.module';
import AuthCSRFMiddlewareModule from '@app/injectable/auth/csrf/middleware.module';
import AuthCSRFReferrerMiddleware from '@app/injectable/auth/csrf/referrer.middleware';
import AuthJWTGuardCheckMiddleware from '@app/injectable/auth/jwt/guard/check.middleware';
import { AuthTryMiddlewareParams as AuthJWTGuardGuideAuthTryMiddlewareParamsType } from '@app/injectable/auth/jwt/guard/guide.middleware.interface';
import AuthJWTGuardNoLoginOnlyMiddleware from '@app/injectable/auth/jwt/guard/noLoginOnly.middleware';
import AuthJWTGuardRoleMiddleware from '@app/injectable/auth/jwt/guard/role.middleware';
import AuthJWTJsonWebTokenModule from '@app/injectable/auth/jwt/jsonWebToken.module';
import AuthRateLimiterDefaultMiddleware from '@app/injectable/auth/rateLimiter/default.middleware';
import { RateLimiterOptionMiddlewareParams as AuthRateLimiterOptionRateLimiterOptionMiddlewareParamsType } from '@app/injectable/auth/rateLimiter/option.middleware.interface';

// Type definitions
type AuthCSRFHelperModuleType = InstanceType<typeof AuthCSRFHelperModule>;
type AuthCSRFMiddlewareModuleType = InstanceType<typeof AuthCSRFMiddlewareModule>;
type AuthJWTJsonWebTokenModuleType = InstanceType<typeof AuthJWTJsonWebTokenModule>;
type AuthCSRFReferrerMiddlewareType = ReturnType<typeof AuthCSRFReferrerMiddleware>;
type AuthJWTGuardCheckMiddlewareType = ReturnType<typeof AuthJWTGuardCheckMiddleware>;
type AuthJWTGuardNoLoginOnlyMiddlewareType = ReturnType<typeof AuthJWTGuardNoLoginOnlyMiddleware>;
type AuthJWTGuardRoleMiddlewareType = ReturnType<typeof AuthJWTGuardRoleMiddleware>;
type AuthRateLimiterDefaultMiddlewareType = ReturnType<typeof AuthRateLimiterDefaultMiddleware>;
type authJwtGuardGuideMiddlewareParamsType = AuthJWTGuardGuideAuthTryMiddlewareParamsType;
type authRateLimiterOptionMiddlewareParamsType = AuthRateLimiterOptionRateLimiterOptionMiddlewareParamsType;

// Injectable modules interface
export interface Injectable {
  authCsrfHelper: AuthCSRFHelperModuleType;
  authCsrfMiddleware: AuthCSRFMiddlewareModuleType;
  authJwtJsonWebToken: AuthJWTJsonWebTokenModuleType;
}

// Middleware interface
export interface Middleware {
  authCsrfReferrer: AuthCSRFReferrerMiddlewareType;
  authJwtGuardCheck: AuthJWTGuardCheckMiddlewareType;
  authJwtGuardNoLoginOnly: AuthJWTGuardNoLoginOnlyMiddlewareType;
  authJwtGuardRole: AuthJWTGuardRoleMiddlewareType;
  authRateLimiterDefault: AuthRateLimiterDefaultMiddlewareType;
}

// Middleware parameters interface
export interface MiddlewareParams {
  authJwtGuardGuide: authJwtGuardGuideMiddlewareParamsType;
  authRateLimiterOption: authRateLimiterOptionMiddlewareParamsType;
}

// Module registry for dynamic loading
export const MODULE_REGISTRY = {
  'authCsrfHelper': () => import('@app/injectable/auth/csrf/helper.module'),
  'authCsrfMiddleware': () => import('@app/injectable/auth/csrf/middleware.module'),
  'authJwtJsonWebToken': () => import('@app/injectable/auth/jwt/jsonWebToken.module'),
} as const;

// Middleware registry for dynamic loading
export const MIDDLEWARE_REGISTRY = {
  'authCsrfReferrer': () => import('@app/injectable/auth/csrf/referrer.middleware'),
  'authJwtGuardCheck': () => import('@app/injectable/auth/jwt/guard/check.middleware'),
  'authJwtGuardNoLoginOnly': () => import('@app/injectable/auth/jwt/guard/noLoginOnly.middleware'),
  'authJwtGuardRole': () => import('@app/injectable/auth/jwt/guard/role.middleware'),
  'authRateLimiterDefault': () => import('@app/injectable/auth/rateLimiter/default.middleware'),
} as const;

// Middleware parameter mapping
export const MIDDLEWARE_PARAM_MAPPING = {
  'authJwtGuardCheck': 'authJwtGuardGuide',
  'authJwtGuardNoLoginOnly': 'authJwtGuardGuide',
  'authJwtGuardRole': 'authJwtGuardGuide',
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
