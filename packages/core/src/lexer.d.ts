import { Token } from './types.js';
export declare class LeanLexer {
    private input;
    private pos;
    private len;
    line: number;
    column: number;
    private indentStack;
    tokens: Token[];
    private indentationHandled;
    private indentChar;
    constructor(input: string);
    tokenize(): Token[];
    private handleIndentation;
    private readString;
    private readNumber;
    private readIdentifier;
}
//# sourceMappingURL=lexer.d.ts.map