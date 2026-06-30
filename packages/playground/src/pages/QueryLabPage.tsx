import React, { useMemo, useState } from 'react';
import { parse } from '@lean-format/core';
import { QUERY_EXAMPLE } from '../data/examples';

interface Filter {
  field: string;
  operator: string;
  value: string;
}

export function QueryLabPage() {
  const [code, setCode] = useState(QUERY_EXAMPLE);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);

  const parseResult = useMemo(() => parse(code), [code]);

  const models = useMemo(() => {
    if (!parseResult.success) return [];
    return parseResult.ast.filter((n) => n.type === 'model');
  }, [parseResult]);

  const currentModel = useMemo(() => {
    return models.find((m) => m.name === selectedModel);
  }, [models, selectedModel]);

  const modelFields = useMemo(() => {
    if (!currentModel?.children) return [];
    return currentModel.children.filter((c) => c.type === 'field' && c.name);
  }, [currentModel]);

  const generatedSQL = useMemo(() => {
    if (!selectedModel || selectedFields.length === 0) return '';
    const fields = selectedFields.join(', ');
    let sql = `SELECT ${selectedModel}.${fields}\nFROM ${selectedModel}`;
    if (filters.length > 0) {
      const where = filters
        .filter((f) => f.field && f.value)
        .map((f) => `${selectedModel}.${f.field} ${f.operator} ${isNaN(Number(f.value)) ? `"${f.value}"` : f.value}`)
        .join('\n  AND ');
      if (where) sql += `\nWHERE ${where}`;
    }
    sql += ';';
    return sql;
  }, [selectedModel, selectedFields, filters]);

  const handleToggleField = (fieldName: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName]
    );
  };

  const handleAddFilter = () => {
    setFilters((prev) => [...prev, { field: '', operator: '=', value: '' }]);
  };

  const handleUpdateFilter = (idx: number, update: Partial<Filter>) => {
    setFilters((prev) => prev.map((f, i) => (i === idx ? { ...f, ...update } : f)));
  };

  const handleRemoveFilter = (idx: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Query Lab</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Build queries visually from your LEAN schema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="lean-card">
            <h3 className="text-sm font-medium mb-2">Schema Input</h3>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="lean-input font-mono text-xs h-48 resize-none"
            />
          </div>

          <div className="lean-card">
            <h3 className="text-sm font-medium mb-2">Select Model</h3>
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setSelectedFields([]);
                setFilters([]);
              }}
              className="lean-input"
            >
              <option value="">-- Choose a model --</option>
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {selectedModel && (
            <>
              <div className="lean-card">
                <h3 className="text-sm font-medium mb-2">Select Fields</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {modelFields.map((field) => (
                    <label key={field.name} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.name!)}
                        onChange={() => handleToggleField(field.name!)}
                        className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span>{field.name}</span>
                      {field.value !== undefined && (
                        <span className="text-xs text-gray-400">: {String(field.value)}</span>
                      )}
                    </label>
                  ))}
                  {modelFields.length === 0 && (
                    <p className="text-xs text-gray-400">No fields found in this model</p>
                  )}
                </div>
              </div>

              <div className="lean-card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Filters</h3>
                  <button onClick={handleAddFilter} className="lean-btn-primary text-xs px-2 py-1">
                    + Add Filter
                  </button>
                </div>
                <div className="space-y-2">
                  {filters.map((filter, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <select
                        value={filter.field}
                        onChange={(e) => handleUpdateFilter(idx, { field: e.target.value })}
                        className="lean-input text-xs flex-1"
                      >
                        <option value="">Field</option>
                        {modelFields.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={filter.operator}
                        onChange={(e) => handleUpdateFilter(idx, { operator: e.target.value })}
                        className="lean-input text-xs w-16"
                      >
                        <option value="=">=</option>
                        <option value="!=">!=</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                        <option value="LIKE">LIKE</option>
                      </select>
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => handleUpdateFilter(idx, { value: e.target.value })}
                        placeholder="value"
                        className="lean-input text-xs flex-1"
                      />
                      <button
                        onClick={() => handleRemoveFilter(idx)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {filters.length === 0 && (
                    <p className="text-xs text-gray-400">No filters added yet</p>
                  )}
                </div>
              </div>
            </>
          )}

          {generatedSQL && (
            <div className="lean-card">
              <h3 className="text-sm font-medium mb-2">Generated Query</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-xs font-mono overflow-x-auto">
                {generatedSQL}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(generatedSQL)}
                className="lean-btn-secondary text-xs mt-2 px-3 py-1"
              >
                Copy to Clipboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
