import React, { useState } from 'react';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { jqService } from '../services';
import type { TransformResult } from '../types';

export const JQPlayground: React.FC = () => {
  const [expression, setExpression] = useState('{ id: .id, name: .name }');
  const [input, setInput] = useState('{\n  "id": 123,\n  "name": "Test"\n}');
  const [result, setResult] = useState<TransformResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleTest = async () => {
    setIsRunning(true);
    try {
      const inputData = JSON.parse(input);
      const transformResult = await jqService.transform(expression, inputData);
      setResult(transformResult);
    } catch (error: any) {
      setResult({
        success: false,
        error: `Invalid JSON input: ${error.message}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Paper
      data-testid="jq-playground"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}
    >
      <Typography variant="h6" gutterBottom>
        JQ Playground
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, minHeight: 0 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle2">Input JSON</Typography>
          <Box
            data-testid="jq-input-editor"
            sx={{ flexGrow: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Editor
              height="100%"
              language="json"
              value={input}
              onChange={(value) => setInput(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
              }}
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle2">JQ Expression</Typography>
          <Box
            data-testid="jq-expression-editor"
            sx={{
              height: '150px',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Editor
              height="100%"
              language="javascript"
              value={expression}
              onChange={(value) => setExpression(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'off',
              }}
              data-testid="jq-expression"
            />
          </Box>

          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={handleTest}
            disabled={isRunning}
            data-testid="run-transform-button"
          >
            Test Transform
          </Button>

          <Typography variant="subtitle2">Output</Typography>
          <Box
            data-testid="jq-output-display"
            sx={{ flexGrow: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            {result && (
              <>
                {result.success ? (
                  <Editor
                    height="100%"
                    language="json"
                    value={JSON.stringify(result.output, null, 2)}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                    }}
                  />
                ) : (
                  <Box sx={{ p: 2 }}>
                    <Alert severity="error" data-testid="transform-error">
                      {result.error}
                    </Alert>
                    {result.suggestions && result.suggestions.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Suggestions:
                        </Typography>
                        <ul>
                          {result.suggestions.map((suggestion, index) => (
                            <li key={index}>
                              <Typography variant="body2">{suggestion}</Typography>
                            </li>
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
