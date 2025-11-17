/**
 * Convert JavaScript object to LEAN format
 * @module serializer
 */

function toLean(obj, options = {}) {
  const indent = options.indent || '  ';
  const useRowSyntax = options.useRowSyntax !== false;
  const rowThreshold = options.rowThreshold || 3;

  function toLeanValue(value, level = 0) {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') {
      if (/[\s,:#\[\]\{\}]/.test(value) || value === 'true' || value === 'false' || value === 'null') {
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
    
    if (useRowSyntax && arr.length >= rowThreshold && arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
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
    const prefix = indent.repeat(level);
    let result = '';
    
    Object.entries(obj).forEach(([key, value]) => {
      if (useRowSyntax && Array.isArray(value) && value.length >= rowThreshold) {
        const isUniformObjects = value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
        if (isUniformObjects && value.length > 0) {
          const keys = Object.keys(value[0]);
          const isUniform = value.every(item => {
            const itemKeys = Object.keys(item);
            return itemKeys.length === keys.length && keys.every(k => itemKeys.includes(k));
          });
          if (isUniform) {
            result += `${prefix}${key}(${keys.join(', ')}):\n`;
            value.forEach(item => {
              const values = keys.map(k => toLeanValue(item[k], level + 1));
              result += `${indent.repeat(level + 1)}- ${values.join(', ')}\n`;
            });
            return;
          }
        }
      }
      
      const valueStr = toLeanValue(value, level);
      if (valueStr.startsWith('\n')) {
        result += `${prefix}${key}:${valueStr}`;
      } else {
        result += `${prefix}${key}: ${valueStr}\n`;
      }
    });
    
    return result;
  }

  return toLeanObject(obj, 0).trimEnd();
}

module.exports = { toLean };
