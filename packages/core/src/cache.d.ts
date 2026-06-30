import { type ParseOptions } from './types.js';
export declare class ParseCache {
    private cache;
    private maxSize;
    hits: number;
    misses: number;
    evictions: number;
    constructor(maxSize?: number);
    get(input: string, options: ParseOptions): unknown | undefined;
    set(input: string, options: ParseOptions, result: unknown): void;
    clear(): void;
    get size(): number;
    stats(): {
        hits: number;
        misses: number;
        evictions: number;
        size: number;
        maxSize: number;
    };
}
export declare function cachedParse(input: string, options?: ParseOptions, cache?: ParseCache): Promise<unknown>;
export declare const defaultCache: ParseCache;
//# sourceMappingURL=cache.d.ts.map