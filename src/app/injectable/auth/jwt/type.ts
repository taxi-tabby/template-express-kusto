
// === Core Interfaces ===

export interface JWTConfig {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    saltRounds: number;
}

export interface TokenPayload {
    userId: string;
    uuid: string;
    email: string;
    role?: string[];
    jti?: string;
    jwtVersion?: number;
    iat?: number;
    exp?: number;
}

export interface SignInCredentials {
    email: string;
    password: string;
}

export interface SignInResult {
    success: boolean;
    user?: {
        id: string;
        email: string;
        role?: string;
    };
    accessToken?: string;
    refreshToken?: string;
    message?: string;
}

export interface UserDbRecord {
    id: string;
    email: string;
    hashedPassword: string;
    role?: string;
    isActive?: boolean;
    [key: string]: any;
}

// === User Session Types ===

export interface UserSession {
    jti: string;
    familyId: string;
    deviceId: string;
    generation: number;
    refreshJti?: string;
    refreshTokenExpiresAt?: Date;
}

export interface AuthenticatedUser {
    id: string;
    uuid: string;
    email: string;
    isActive: boolean;
    isVerified: boolean;
    session: UserSession;
}

// === Callback Types ===
export type UserLookupCallback = (email: string) => Promise<UserDbRecord | null>;
