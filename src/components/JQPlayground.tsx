import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Paper, Typography, Button, Alert, Menu, MenuItem, IconButton, Dialog,
  DialogTitle, DialogContent, TextField, List, ListItem, ListItemButton, ListItemText,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  ContentCopy as CopyIcon,
  FormatAlignLeft as FormatIcon,
  MenuBook as ExamplesIcon,
  History as HistoryIcon,
  Help as ReferenceIcon,
} from '@mui/icons-material';
import { jqService } from '../services';
import type { TransformResult } from '../types';

const EXAMPLES = [
  { id: 'extract-fields', label: 'Extract Fields', expression: '{ id: .id, name: .name }' },
  { id: 'filter-array', label: 'Filter Array', expression: '[.items[] | select(.active == true)]' },
  { id: 'map-transform', label: 'Map Transform', expression: '[.items[] | { id: .id, label: .name }]' },
  { id: 'conditional', label: 'Conditional', expression: 'if .priority == "high" then .sla = 1 else .sla = 24 end | .' },
];

const JQ_FUNCTIONS = [
  { id: 'map', name: 'map', description: 'Apply a filter to each element: [.[] | f]' },
  { id: 'select', name: 'select', description: 'Filter elements matching a condition' },
  { id: 'length', name: 'length', description: 'Return the length of an array/string/object' },
  { id: 'keys', name: 'keys', description: 'Return the keys of an object as an array' },
  { id: 'values', name: 'values', description: 'Return the values of an object as an array' },
  { id: 'flatten', name: 'flatten', description: 'Flatten nested arrays' },
  { id: 'sort_by', name: 'sort_by', description: 'Sort an array by a given expression' },
  { id: 'group_by', name: 'group_by', description: 'Group array elements by a key' },
  { id: 'unique_by', name: 'unique_by', description: 'Remove duplicate elements by a key' },
  { id: 'ascii_upcase', name: 'ascii_upcase', description: 'Convert string to uppercase' },
  { id: 'ascii_downcase', name: 'ascii_downcase', description: 'Convert string to lowercase' },
  { id: 'tostring', name: 'tostring', description: 'Convert value to string' },
  { id: 'tonumber', name: 'tonumber', description: 'Convert string to number' },
  { id: 'type', name: 'type', description: 'Return the type of a value' },
  { id: 'empty', name: 'empty', description: 'Return no output' },
  { id: 'add', name: 'add', description: 'Sum an array of numbers or concatenate strings' },
];

const textareaStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
  fontSize: '14px',
  lineHeight: '1.5',
  padding: '8px 12px',
  border: 'none',
  outline: 'none',
  resize: 'none',
  backgroundColor: '#fff',
  color: '#333',
  tabSize: 2,
  boxSizing: 'border-box' as const,
  overflow: 'auto',
};

export const JQPlayground: React.FC = () => {
  const [expression, setExpression] = useState('{ id: .id, name: .name }');
  const [input, setInput] = useState('{\n  "id": 123,\n  "name": "Test"\n}');
  const [result, setResult] = useState<TransformResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyAnchor, setHistoryAnchor] = useState<null | HTMLElement>(null);
  const [syntaxError, setSyntaxError] = useState(false);
  const [refDialogOpen, setRefDialogOpen] = useState(false);
  const [refSearch, setRefSearch] = useState('');
  const validationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live syntax validation
  const validateExpression = useCallback(async (expr: string) => {
    if (!expr.trim()) {
      setSyntaxError(false);
      return;
    }
    try {
      const validation = await jqService.validate(expr);
      setSyntaxError(!validation.valid);
    } catch {
      setSyntaxError(true);
    }
  }, []);

  useEffect(() => {
    if (validationTimer.current) clearTimeout(validationTimer.current);
    validationTimer.current = setTimeout(() => validateExpression(expression), 300);
    return () => { if (validationTimer.current) clearTimeout(validationTimer.current); };
  }, [expression, validateExpression]);

  const handleTest = async () => {
    setIsRunning(true);
    try {
      const inputData = JSON.parse(input);
      const transformResult = await jqService.transform(expression, inputData);

      // Treat null output from field access as a potential error
      if (transformResult.success && transformResult.output === null && expression.includes('.')) {
        setResult({
          success: false,
          error: 'Expression returned null - the field path may not exist in the input data',
          suggestions: [
            'Check if all field paths exist in your input data',
            'Use the // operator for default values: .field // "default"',
          ],
        });
      } else {
        setResult(transformResult);
      }

      // Add to history
      if (!history.includes(expression)) {
        setHistory((prev) => [expression, ...prev].slice(0, 20));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setResult({ success: false, error: `Invalid JSON input: ${message}` });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyOutput = async () => {
    if (result?.success && result.output !== undefined) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(result.output, null, 2));
      } catch {
        // clipboard fallback
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleFormatOutput = () => {
    // Output is already formatted via JSON.stringify
  };

  const handleSelectExample = (expr: string) => {
    setExpression(expr);
    setAnchorEl(null);
  };

  const handleLoadFromHistory = (expr: string) => {
    setExpression(expr);
    setHistoryAnchor(null);
  };

  const filteredFunctions = JQ_FUNCTIONS.filter(
    (f) => f.name.toLowerCase().includes(refSearch.toLowerCase()) ||
           f.description.toLowerCase().includes(refSearch.toLowerCase())
  );

  return (
    <Paper
      data-testid="jq-playground"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}
    >
      <Typography variant="h6" gutterBottom>JQ Playground</Typography>

      <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, minHeight: 0 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle2">Input JSON</Typography>
          <Box
            data-testid="jq-input-editor"
            sx={{ flexGrow: 1, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={textareaStyle}
              spellCheck={false}
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2">JQ Expression</Typography>
            <Box>
              <IconButton
                size="small"
                onClick={(e) => setHistoryAnchor(e.currentTarget)}
                data-testid="jq-history-button"
                aria-label="History"
              >
                <HistoryIcon fontSize="small" />
              </IconButton>
              <Menu anchorEl={historyAnchor} open={Boolean(historyAnchor)} onClose={() => setHistoryAnchor(null)}>
                {history.length === 0 ? (
                  <MenuItem disabled>No history yet</MenuItem>
                ) : (
                  history.map((expr, i) => (
                    <MenuItem
                      key={i}
                      onClick={() => handleLoadFromHistory(expr)}
                      data-testid="history-item"
                    >
                      {expr.length > 40 ? expr.slice(0, 40) + '...' : expr}
                    </MenuItem>
                  ))
                )}
              </Menu>
              <IconButton
                size="small"
                onClick={() => setRefDialogOpen(true)}
                data-testid="jq-reference-button"
                aria-label="Function Reference"
              >
                <ReferenceIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                data-testid="jq-examples-button"
                aria-label="Examples"
              >
                <ExamplesIcon fontSize="small" />
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                {EXAMPLES.map((ex) => (
                  <MenuItem
                    key={ex.id}
                    onClick={() => handleSelectExample(ex.expression)}
                    data-testid={`example-${ex.id}`}
                  >
                    {ex.label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Box>
          <Box
            data-testid="jq-expression-editor"
            sx={{
              height: '150px',
              border: 1,
              borderColor: syntaxError ? 'error.main' : 'divider',
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <textarea
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              style={textareaStyle}
              spellCheck={false}
            />
            {syntaxError && (
              <Box
                data-testid="syntax-error-indicator"
                sx={{
                  position: 'absolute', bottom: 4, right: 4, bgcolor: 'error.main',
                  color: 'white', px: 1, py: 0.25, borderRadius: 1, fontSize: '12px',
                }}
              >
                Syntax Error
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={handleTest}
              disabled={isRunning}
              data-testid="run-transform-button"
            >
              Test Transform
            </Button>
            {result?.success && (
              <>
                <IconButton size="small" onClick={handleFormatOutput} data-testid="format-output-button" aria-label="Format output">
                  <FormatIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleCopyOutput} data-testid="copy-output-button" aria-label="Copy output">
                  <CopyIcon fontSize="small" />
                </IconButton>
              </>
            )}
            {copySuccess && (
              <Alert severity="success" data-testid="copy-success-message" sx={{ py: 0 }}>Copied!</Alert>
            )}
          </Box>

          <Typography variant="subtitle2">Output</Typography>
          <Box
            data-testid="jq-output-display"
            sx={{ flexGrow: 1, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'auto' }}
          >
            {result && (
              <>
                {result.success ? (
                  <pre style={{ margin: 0, padding: '8px 12px', fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify(result.output, null, 2)}
                  </pre>
                ) : (
                  <Box sx={{ p: 2 }}>
                    <Alert severity="error" data-testid="jq-error-display">{result.error}</Alert>
                    {result.suggestions && result.suggestions.length > 0 && (
                      <Box sx={{ mt: 2 }} data-testid="jq-error-suggestions">
                        <Typography variant="subtitle2" gutterBottom>Suggestions:</Typography>
                        <ul>
                          {result.suggestions.map((suggestion, index) => (
                            <li key={index}><Typography variant="body2">{suggestion}</Typography></li>
                          ))}
                        </ul>
                      </Box>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Function Reference Dialog */}
      <Dialog
        open={refDialogOpen}
        onClose={() => setRefDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        data-testid="jq-reference-panel"
      >
        <DialogTitle>JQ Function Reference</DialogTitle>
        <DialogContent>
          <TextField
            size="small"
            fullWidth
            placeholder="Search functions..."
            value={refSearch}
            onChange={(e) => setRefSearch(e.target.value)}
            slotProps={{ htmlInput: { 'data-testid': 'reference-search' } }}
            sx={{ mb: 2 }}
          />
          <List>
            {filteredFunctions.map((fn) => (
              <ListItem key={fn.id} disablePadding data-testid={`function-${fn.id}`}>
                <ListItemButton onClick={() => {
                  setExpression((prev) => prev + fn.name);
                  setRefDialogOpen(false);
                }}>
                  <ListItemText primary={fn.name} secondary={fn.description} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};
