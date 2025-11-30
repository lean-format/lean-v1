/**
 * @license
 * Copyright (c) 2025 LEAN Format Team and contributors
 * Licensed under MIT License
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

export class LeanSerializer {
    constructor(options = {}) {
        this.options = options;
    }
    serialize(obj) {
        return toLean(obj, this.options);
    }
}

export function toLean(obj, options = {}) {
    const {
        indent = '  ',
        useRowSyntax = true,
        rowThreshold = 1
    } = options;

    function isPrimitive(v) {
        return (
            v === null ||
            v === undefined ||
            typeof v === 'boolean' ||
            typeof v === 'number' ||
            typeof v === 'string'
        );
    }

    function toLeanValue(value, level = 0) {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'string') {
            const needsQuotes = (str) => {
                if (/[\s,:[\]{}#@/+]/.test(str)) return true;
                if (/^[0-9-]/.test(str)) return true;
                return str === 'true' || str === 'false' || str === 'null';

            };
            return needsQuotes(value)
                ? `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
                : value;
        }
        if (Array.isArray(value)) return toLeanArray(value, level);
        if (typeof value === 'object') return toLeanObject(value, level);
        return 'null';
    }

    function toLeanArray(arr, level) {
        if (arr.length === 0) return '';
        const prefix = indent.repeat(level + 1);

        const isArrayOfObjects =
            arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));

        if (useRowSyntax && isArrayOfObjects && arr.length >= rowThreshold) {
            const keys = Object.keys(arr[0]);
            const isUniform = arr.every(item => {
                const itemKeys = Object.keys(item);
                return (
                    itemKeys.length === keys.length &&
                    keys.every(k => itemKeys.includes(k))
                );
            });

            const allFlat = arr.every(item =>
                Object.values(item).every(v => isPrimitive(v))
            );

            if (isUniform && keys.length > 0 && allFlat) {
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
        const hasDotKeys = Object.keys(obj).some(k => k.includes('.'));
        const flatObj = hasDotKeys ? obj : flattenObject(obj);
        const entries = Object.entries(flatObj);
        if (entries.length === 0) return '{}';

        entries.sort(([a], [b]) => a.localeCompare(b));

        const prefix = indent.repeat(level);
        let result = '';

        for (const [key, value] of entries) {
            if (Array.isArray(value) && value.length > 0) {
                const isArrayOfObjects =
                    value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));

                if (isArrayOfObjects) {
                    const keys = Object.keys(value[0]);
                    const isUniform = value.every(item => {
                        const itemKeys = Object.keys(item);
                        return (
                            itemKeys.length === keys.length &&
                            keys.every(k => itemKeys.includes(k))
                        );
                    });

                    const allFlat = value.every(item =>
                        Object.values(item).every(v => isPrimitive(v))
                    );

                    if (useRowSyntax && isUniform && keys.length > 0 &&
                        value.length >= rowThreshold && allFlat) {

                        result += `${prefix}${key}(${keys.join(', ')}):\n`;
                        value.forEach(item => {
                            const values = keys.map(k => toLeanValue(item[k], level + 1));
                            result += `${indent.repeat(level + 1)}- ${values.join(', ')}\n`;
                        });
                        continue;
                    }
                }
            }

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