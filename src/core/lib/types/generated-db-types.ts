// Auto-generated file - Do not edit manually
// Generated from src/app/db folder structure

/**
 * Import actual Prisma client types from each database
 */
type DefaultClient = typeof import('@app/db/default/client')['PrismaClient'];
type TemporaryClient = typeof import('@app/db/temporary/client')['PrismaClient'];

/**
 * Instantiated client types
 */
type DefaultInstance = InstanceType<DefaultClient>;
type TemporaryInstance = InstanceType<TemporaryClient>;

/**
 * Type mapping for database names to their corresponding Prisma client instances
 */
export interface DatabaseClientMap {
  default: DefaultInstance;
  temporary: TemporaryInstance;
  [key: string]: any; // Allow for additional databases
}

/**
 * Enhanced client type that preserves actual Prisma client type information
 */
export type DatabaseClientType<T extends string> = T extends keyof DatabaseClientMap 
  ? DatabaseClientMap[T] 
  : any;

/**
 * Valid database names
 */
export type DatabaseName = keyof DatabaseClientMap;

/**
 * Database names as Union type
 */
export type DatabaseNamesUnion = 'default' | 'temporary';

/**
 * Method overloads for getWrap
 */
export interface PrismaManagerWrapOverloads {
  getWrap(databaseName: 'default'): DefaultInstance;
  getWrap(databaseName: 'temporary'): TemporaryInstance;
  getWrap<T extends string>(databaseName: T): DatabaseClientType<T>;
}

/**
 * Method overloads for getClient
 */
export interface PrismaManagerClientOverloads {
  getClient(databaseName: 'default'): DefaultInstance;
  getClient(databaseName: 'temporary'): TemporaryInstance;
  getClient<T = any>(databaseName: string): T;
}


/**
 * Extend PrismaManager class with proper method overloads
 */
declare module '../prismaManager' {
  interface PrismaManager {
  getWrap(databaseName: 'default'): DefaultInstance;
  getWrap(databaseName: 'temporary'): TemporaryInstance;
  getClient(databaseName: 'default'): DefaultInstance;
  getClient(databaseName: 'temporary'): TemporaryInstance;
  }
}
