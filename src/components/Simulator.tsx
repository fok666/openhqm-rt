import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { useSimulationStore, useRouteStore } from '../store';

export const Simulator: React.FC = () => {
  const { routes } = useRouteStore();
  const { currentSimulation, startSimulation, isRunning } = useSimulationStore();
  const [input, setInput] = useState(
    '{\n  "order": {\n    "id": 123,\n    "priority": "high"\n  }\n}'
  );
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');

  const handleSimulate = async () => {
    try {
      const payload = JSON.parse(input);
      const headerData = JSON.parse(headers);

      await startSimulation(
        {
          payload,
          headers: headerData,
          metadata: {},
        },
        routes
      );
    } catch (error: any) {
      alert(`Invalid JSON: ${error.message}`);
    }
  };

  return (
    <Paper
      data-testid="simulator"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}
    >
      <Typography variant="h6" gutterBottom>
        Route Simulator
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Payload
          </Typography>
          <Box
            data-testid="simulation-payload-editor"
            sx={{ height: '200px', border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Editor
              height="100%"
              language="json"
              value={input}
              onChange={(value) => setInput(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
              }}
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Headers
          </Typography>
          <Box sx={{ height: '200px', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Editor
              height="100%"
              language="json"
              value={headers}
              onChange={(value) => setHeaders(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
              }}
            />
          </Box>
        </Box>
      </Box>

      <Button
        variant="contained"
        startIcon={<PlayIcon />}
        onClick={handleSimulate}
        disabled={isRunning || routes.length === 0}
        sx={{ mb: 2 }}
        data-testid="run-simulation-button"
      >
        {isRunning ? 'Running...' : 'Simulate Routing'}
      </Button>

      {currentSimulation && (
        <Box data-testid="simulation-results" sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>

          {currentSimulation.output.matchedRoute ? (
            <Alert
              data-testid="matched-route"
              severity="success"
              icon={<CheckIcon />}
              sx={{ mb: 2 }}
            >
              Route matched: {currentSimulation.output.matchedRoute}
              <br />
              Destination: {currentSimulation.output.destination}
              <br />
              Duration: {currentSimulation.metrics.totalDuration.toFixed(2)}ms
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No matching route found
            </Alert>
          )}

          {currentSimulation.output.errors.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {currentSimulation.output.errors.map((error, index) => (
                <Alert key={index} severity={error.severity} sx={{ mb: 1 }}>
                  {error.message}
                  {error.suggestion && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Suggestion: {error.suggestion}
                    </Typography>
                  )}
                </Alert>
              ))}
            </Box>
          )}

          <Typography variant="subtitle1" gutterBottom>
            Execution Trace
          </Typography>
          {currentSimulation.trace.map((step, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  {step.success ? (
                    <CheckIcon color="success" fontSize="small" />
                  ) : (
                    <ErrorIcon color="error" fontSize="small" />
                  )}
                  <Typography sx={{ flex: 1 }}>{step.description}</Typography>
                  <Chip label={`${step.duration.toFixed(2)}ms`} size="small" />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {step.input && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Input:
                    </Typography>
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: '8px',
                        borderRadius: '4px',
                        overflow: 'auto',
                      }}
                    >
                      {JSON.stringify(step.input, null, 2)}
                    </pre>
                  </Box>
                )}
                {step.output && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Output:
                    </Typography>
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: '8px',
                        borderRadius: '4px',
                        overflow: 'auto',
                      }}
                    >
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  </Box>
                )}
                {step.error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {step.error}
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Paper>
  );
};
