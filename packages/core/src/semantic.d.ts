export interface SemanticWarning {
    type: 'type-inconsistency' | 'empty-value' | 'trailing-comma' | 'suspicious-ref' | 'mixed-indent';
    path: string;
    message: string;
    suggestion?: string;
}
export interface SemanticResult {
    warnings: SemanticWarning[];
}
export declare function analyze(input: string, parsed: unknown): SemanticResult;
export declare function hasWarnings(result: SemanticResult): boolean;
export declare function formatWarnings(result: SemanticResult, _colors?: boolean): string;
//# sourceMappingURL=semantic.d.ts.map