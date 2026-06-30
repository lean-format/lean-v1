import { ParseOptions, ParseResult, ValidationResult } from './types';
export declare function parse(source: string, _options?: ParseOptions): ParseResult;
export declare function validate(source: string): ValidationResult[];
export declare function format(source: string): string;
export declare function parseWasm(source: string): Promise<ParseResult>;
//# sourceMappingURL=parser.d.ts.map