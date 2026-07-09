// Minimal ambient types for Bun's test runner. `@types/bun` is not installed and
// this project's tsconfig type-checks `**/*.ts` (including `*.test.ts`), so this
// shim lets `tsc --noEmit` resolve `bun:test`; Bun provides the real module at
// runtime. Remove if `@types/bun` is ever added as a dev dependency.
declare module "bun:test" {
  export interface Matchers<T = unknown> {
    toBe(expected: T): void;
    toEqual(expected: unknown): void;
    toStrictEqual(expected: unknown): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(expected: unknown): void;
    toContainEqual(expected: unknown): void;
    toHaveLength(length: number): void;
    toHaveProperty(key: string, value?: unknown): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toBeInstanceOf(expected: unknown): void;
    toThrow(expected?: unknown): void;
    toMatch(expected: string | RegExp): void;
    readonly not: Matchers<T>;
    readonly resolves: Matchers<Awaited<T>>;
    readonly rejects: Matchers<unknown>;
  }
  export function expect<T = unknown>(actual: T): Matchers<T>;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function describe(name: string, fn: () => void): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
}
