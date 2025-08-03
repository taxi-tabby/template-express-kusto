
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

// === Callback Types ===
export type UserLookupCallback = (email: string) => Promise<UserDbRecord | null>;
