# @lean-format/core

## 2.1.0

### Minor Changes

- feat: add `ParseCache` LRU cache with content-hash keys for faster repeated parsing
- feat: add `cachedParse()` convenience function with default global cache
- feat: add `IncrementalParser` class for differential parsing — re-parses only changed top-level blocks
- feat: add `parseIncremental()` convenience function with default global parser
- feat: add `analyze()` and `formatWarnings()` for post-parse semantic analysis (type inconsistencies, trailing commas, mixed indentation, suspicious references)
- feat: add `hasWarnings()` helper for checking semantic results
- docs: update specification to reflect Python co-implementation with inline objects/arrays, WebSocket codec, and dot-notation expansion
