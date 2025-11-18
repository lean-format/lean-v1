/**
 * Convert JavaScript object to LEAN format
 * @module serializer
 */

/**
 * Flatten a nested object into a single level with dot notation
 * @param {Object} obj - The object to flatten
 * @param {string} [prefix=''] - The prefix to use for nested keys
 * @returns {Object} Flattened object
 */
function flattenObject(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
}

export function toLean(obj, options = {}) {
    // Default options with row syntax enabled by default
    const {
        indent = '  ',
        eol = '\n',
        useRowSyntax = true,  // Enable row syntax by default
        rowThreshold = 1      // Use row syntax even for a single row
    } = options;

    function toLeanValue(value, level = 0) {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'string') {
            // Only quote if necessary
            if (/[\s,:\[\]\{\}]/.test(value) || value === 'true' || value === 'false' || value === 'null') {
                return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
            }
            return value;
        }
        if (Array.isArray(value)) return toLeanArray(value, level);
        if (typeof value === 'object') return toLeanObject(value, level);
        return 'null';
    }

    function toLeanArray(arr, level) {
        if (arr.length === 0) return '';
        const prefix = indent.repeat(level + 1);

        // Check if we should use row syntax based on options
        const shouldUseRowSyntax = useRowSyntax &&
            arr.length >= rowThreshold &&
            arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));

        if (shouldUseRowSyntax) {
            const keys = Object.keys(arr[0]);
            const isUniform = arr.every(item => {
                const itemKeys = Object.keys(item);
                return itemKeys.length === keys.length && keys.every(k => itemKeys.includes(k));
            });
            if (isUniform && keys.length > 0) {
                let result = '\n';
                arr.forEach(item => {
                    const values = keys.map(k => toLeanValue(item[k], level + 1));
                    result += `${prefix}- ${values.join(', ')}\n`;
                });
                return result;
            }
        }

        let result = '\n';
        arr.forEach(item => {
            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                result += `${prefix}-\n`;
                result += toLeanObject(item, level + 2);
            } else {
                result += `${prefix}- ${toLeanValue(item, level + 1)}\n`;
            }
        });
        return result;
    }

    function toLeanObject(obj, level) {
        // Check if object already has dot notation keys (pre-flattened)
        const hasDotKeys = Object.keys(obj).some(k => k.includes('.'));

        // Only flatten if there are no dot notation keys already
        const flatObj = hasDotKeys ? obj : flattenObject(obj);
        const entries = Object.entries(flatObj);
        if (entries.length === 0) return '{}';

        // Sort keys to ensure consistent output
        entries.sort(([a], [b]) => a.localeCompare(b));

        const prefix = indent.repeat(level);
        let result = '';

        for (const [key, value] of entries) {
            // Handle array of objects with row syntax
            if (Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
                const firstItem = value[0];
                const keys = Object.keys(firstItem);
                const isUniform = value.every(item => {
                    const itemKeys = Object.keys(item);
                    return itemKeys.length === keys.length && keys.every(k => itemKeys.includes(k));
                });

                // Use row syntax if enabled and meets threshold
                const shouldUseRowSyntax = useRowSyntax &&
                    isUniform &&
                    keys.length > 0 &&
                    value.length >= rowThreshold;

                if (shouldUseRowSyntax) {
                    result += `${prefix}${key}(${keys.join(', ')}):\n`;
                    value.forEach(item => {
                        const values = keys.map(k => toLeanValue(item[k], level + 1));
                        result += `${indent.repeat(level + 1)}- ${values.join(', ')}\n`;
                    });
                    continue;
                }
            }

            // Handle regular values
            const valueStr = toLeanValue(value, level);
            if (valueStr.startsWith('\n')) {
                result += `${prefix}${key}:${valueStr}`;
            } else {
                result += `${prefix}${key}: ${valueStr}\n`;
            }
        }

        return result;
    }

    return toLeanObject(obj, 0).trimEnd();
}