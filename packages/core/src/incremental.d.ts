import { type ParseOptions } from './types.js';
export declare class IncrementalParser {
    private prevText;
    private prevResult;
    private _options;
    constructor(options?: ParseOptions);
    parse(fullText: string): Record<string, unknown>;
    private incrementalUpdate;
    private extractPartialText;
    reset(): void;
    get prevTextLen(): number;
}
export declare function parseIncremental(input: string, _options?: ParseOptions, parser?: IncrementalParser): Record<string, unknown>;
export declare const defaultIncrementalParser: IncrementalParser;
//# sourceMappingURL=incremental.d.ts.map