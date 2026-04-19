import React, { useState } from 'react';
import { Box, Paper, Typography, Button, Alert, Menu, MenuItem, IconButton } from '@mui/material';
import {
  PlayArrow as PlayIcon,
  ContentCopy as CopyIcon,
  FormatAlignLeft as FormatIcon,
  MenuBook as ExamplesIcon,
} from '@mui/icons-material';
import { jqService } from '../services';
import type { TransformResult } from '../types';

const EXAMPLES = [
  { id: 'extract-fields', label: 'Extract Fields', expression: '{ id: .id, name: .name }' },
  { id: 'filter-array', label: 'Filter Array', expression: '[.items[] | select(.active == true)]' },
  { id: 'map-transform', label: 'Map Transform', expression: '[.items[] | { id: .id, label: .name }]' },
  { id: 'conditional', label: 'Conditional', expression: 'if .priority == "high" then .sla = 1 else .sla = 24 end | .' },
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

  const handleTest = async () => {
    setIsRunning(true);
    try {
      const inputData = JSON.parse(input);
      const transformResult = await jqService.transform(expression, inputData);
      setResult(transformResult);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setResult({ success: false, error: `Invalid JSON input: ${message}` });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyOutput = async () => {
    if (result?.success && result.output) {
      await navigator.clipboard.writeText(JSON.stringify(result.output, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleFormatOutput = () => {
    // Output is already formatted
  };

  const handleSelectExample = (expr: string) => {
    setExpression(expr);
    setAnchorEl(null);
  };

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
          <Box
            data-testid="jq-expression-editor"
            sx={{ height: '150px', border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
          >
            <textarea
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              style={textareaStyle}
              spellCheck={false}
            />
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
    </Paper>
  );
};
