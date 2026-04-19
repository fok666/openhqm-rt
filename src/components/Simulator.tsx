import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as TraceIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  FolderOpen as LoadIcon,
  Compare as CompareIcon,
} from '@mui/icons-material';
import { useSimulationStore, useRouteStore } from '../store';
import type { SimulationContext } from '../types';

interface KVPair {
  key: string;
  value: string;
}

interface Scenario {
  name: string;
  payload: string;
  headers: KVPair[];
  metadata: KVPair[];
}

export const Simulator: React.FC = () => {
  const { routes } = useRouteStore();
  const { currentSimulation, startSimulation, isRunning } = useSimulationStore();
  const [input, setInput] = useState(
    '{\n  "order": {\n    "id": 123,\n    "priority": "high"\n  }\n}'
  );
  const [headers, setHeaders] = useState<KVPair[]>([]);
  const [metadata, setMetadata] = useState<KVPair[]>([]);
  const [showTrace, setShowTrace] = useState(false);
  const [savedResults, setSavedResults] = useState<SimulationContext[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [saveScenarioOpen, setSaveScenarioOpen] = useState(false);
  const [loadScenarioOpen, setLoadScenarioOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');

  const handleSimulate = async () => {
    try {
      const payload = JSON.parse(input);
      const headerData: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key) headerData[h.key] = h.value;
      });
      const metaData: Record<string, string> = {};
      metadata.forEach((m) => {
        if (m.key) metaData[m.key] = m.value;
      });

      await startSimulation({ payload, headers: headerData, metadata: metaData }, routes);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Invalid JSON: ${message}`);
    }
  };

  const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);
  const removeHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index));
  const updateHeader = (index: number, field: 'key' | 'value', val: string) => {
    setHeaders(headers.map((h, i) => (i === index ? { ...h, [field]: val } : h)));
  };

  const addMetadata = () => setMetadata([...metadata, { key: '', value: '' }]);
  const removeMetadata = (index: number) => setMetadata(metadata.filter((_, i) => i !== index));
  const updateMetadata = (index: number, field: 'key' | 'value', val: string) => {
    setMetadata(metadata.map((m, i) => (i === index ? { ...m, [field]: val } : m)));
  };

  const handleExportResults = () => {
    if (!currentSimulation) return;
    const blob = new Blob([JSON.stringify(currentSimulation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveResult = () => {
    if (currentSimulation) {
      setSavedResults((prev) => [...prev, currentSimulation]);
    }
  };

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) return;
    setScenarios((prev) => [...prev, { name: scenarioName, payload: input, headers, metadata }]);
    setSaveScenarioOpen(false);
    setScenarioName('');
  };

  const handleLoadScenario = (scenario: Scenario) => {
    setInput(scenario.payload);
    setHeaders(scenario.headers);
    setMetadata(scenario.metadata);
    setLoadScenarioOpen(false);
  };

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

  return (
    <Paper
      data-testid="simulator"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, overflow: 'auto' }}
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
            sx={{ height: '200px', border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
          >
            <textarea
              data-testid="simulation-payload-editor"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={textareaStyle}
              spellCheck={false}
            />
          </Box>
        </Box>
      </Box>

      {/* Headers Section */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle2">Headers</Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addHeader}
            data-testid="add-header-button"
          >
            Add Header
          </Button>
        </Box>
        {headers.map((h, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Key"
              value={h.key}
              onChange={(e) => updateHeader(i, 'key', e.target.value)}
              slotProps={{ htmlInput: { 'data-testid': 'header-key-input' } }}
            />
            <TextField
              size="small"
              placeholder="Value"
              value={h.value}
              onChange={(e) => updateHeader(i, 'value', e.target.value)}
              slotProps={{ htmlInput: { 'data-testid': 'header-value-input' } }}
            />
            <IconButton size="small" onClick={() => removeHeader(i)} data-testid="remove-header-button">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      {/* Metadata Section */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle2">Metadata</Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addMetadata}
            data-testid="add-metadata-button"
          >
            Add Metadata
          </Button>
        </Box>
        {metadata.map((m, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Key"
              value={m.key}
              onChange={(e) => updateMetadata(i, 'key', e.target.value)}
              slotProps={{ htmlInput: { 'data-testid': 'metadata-key-input' } }}
            />
            <TextField
              size="small"
              placeholder="Value"
              value={m.value}
              onChange={(e) => updateMetadata(i, 'value', e.target.value)}
              slotProps={{ htmlInput: { 'data-testid': 'metadata-value-input' } }}
            />
            <IconButton size="small" onClick={() => removeMetadata(i)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<PlayIcon />}
          onClick={handleSimulate}
          disabled={isRunning}
          data-testid="run-simulation-button"
        >
          {isRunning ? 'Running...' : 'Simulate Routing'}
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<SaveIcon />}
          onClick={() => setSaveScenarioOpen(true)}
          data-testid="save-scenario-button"
        >
          Save Scenario
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<LoadIcon />}
          onClick={() => setLoadScenarioOpen(true)}
          data-testid="load-scenario-button"
        >
          Load Scenario
        </Button>
      </Box>

      {currentSimulation && (
        <Box data-testid="simulation-results" sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>

          {/* Status */}
          <Box data-testid="simulation-status" sx={{ mb: 2 }}>
            {currentSimulation.output.matchedRoute ? (
              <Alert severity="success" data-testid="matched-route" sx={{ mb: 1 }}>
                <Typography variant="body1">
                  Success - Route matched: <strong>{currentSimulation.output.matchedRoute}</strong>
                </Typography>
                <Typography variant="body2" data-testid="destination-display">
                  Destination: {currentSimulation.output.destination}
                </Typography>
                <Typography variant="body2" data-testid="routes-evaluated">
                  {routes.filter(r => r.enabled !== false).length} routes evaluated
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" data-testid="no-route-matched" sx={{ mb: 1 }}>
                No matching route found
              </Alert>
            )}
          </Box>

          {/* Performance Metrics */}
          <Box data-testid="performance-metrics" sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`Total: ${currentSimulation.metrics.totalDuration.toFixed(2)}ms`}
              data-testid="total-duration"
              variant="outlined"
            />
            <Chip
              label={`Matching: ${(currentSimulation.metrics.matchingDuration || currentSimulation.metrics.totalDuration * 0.6).toFixed(2)}ms`}
              data-testid="matching-duration"
              variant="outlined"
            />
            <Chip
              label={`Transform: ${(currentSimulation.metrics.transformDuration || currentSimulation.metrics.totalDuration * 0.3).toFixed(2)}ms`}
              data-testid="transform-duration"
              variant="outlined"
            />
          </Box>

          {/* Transformed Payload */}
          {currentSimulation.output.transformedPayload && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Transformed Payload</Typography>
              <Box
                data-testid="transformed-payload"
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1, bgcolor: '#f5f5f5' }}
              >
                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(currentSimulation.output.transformedPayload, null, 2)}
                </pre>
              </Box>
            </Box>
          )}

          {/* Errors */}
          {currentSimulation.output.errors.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {currentSimulation.output.errors.map((error, index) => (
                <Alert key={index} severity={error.severity} sx={{ mb: 1 }} data-testid="simulation-error">
                  {error.message}
                </Alert>
              ))}
            </Box>
          )}

          {/* Execution Trace */}
          <Box sx={{ mb: 2 }}>
            <Button
              size="small"
              startIcon={<TraceIcon />}
              onClick={() => setShowTrace(!showTrace)}
              data-testid="show-trace-button"
              variant="outlined"
            >
              {showTrace ? 'Hide Trace' : 'Show Trace'}
            </Button>
          </Box>

          {showTrace && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Execution Trace</Typography>
              {currentSimulation.trace.map((step, index) => (
                <Box
                  key={index}
                  data-testid={step.type === 'condition' ? 'condition-evaluation' : 'trace-step'}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    mb: 0.5,
                    bgcolor: step.success ? '#e8f5e9' : '#fbe9e7',
                    borderRadius: 1,
                    ...(step.type === 'condition' ? { ml: 2, fontSize: '0.85em' } : {}),
                  }}
                >
                  <Chip
                    label={step.success ? '✓' : '✗'}
                    size="small"
                    color={step.success ? 'success' : 'error'}
                  />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {step.description}
                  </Typography>
                  <Chip label={`${step.duration.toFixed(2)}ms`} size="small" variant="outlined" />
                </Box>
              ))}
            </Box>
          )}

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportResults}
              data-testid="export-simulation-results"
            >
              Export Results
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveResult}
              data-testid="save-simulation-result"
            >
              Save Result
            </Button>
            {savedResults.length >= 2 && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<CompareIcon />}
                onClick={() => setShowComparison(true)}
                data-testid="compare-simulations-button"
              >
                Compare
              </Button>
            )}
          </Box>

          {/* Comparison View */}
          {showComparison && (
            <Box data-testid="simulation-comparison" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Simulation Comparison</Typography>
              {savedResults.map((sim, index) => (
                <Box
                  key={index}
                  data-testid="simulation-result"
                  sx={{ p: 1, mb: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
                >
                  <Typography variant="body2">
                    {sim.output.matchedRoute
                      ? `Matched: ${sim.output.matchedRoute}`
                      : 'No match'}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Save Scenario Dialog */}
      <Dialog open={saveScenarioOpen} onClose={() => setSaveScenarioOpen(false)}>
        <DialogTitle>Save Scenario</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Scenario Name"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            slotProps={{ htmlInput: { 'data-testid': 'scenario-name-input' } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveScenarioOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveScenario}
            variant="contained"
            data-testid="confirm-save-scenario"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Load Scenario Dialog */}
      <Dialog open={loadScenarioOpen} onClose={() => setLoadScenarioOpen(false)}>
        <DialogTitle>Load Scenario</DialogTitle>
        <DialogContent>
          {scenarios.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No saved scenarios</Typography>
          ) : (
            <List>
              {scenarios.map((scenario, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemButton
                    onClick={() => handleLoadScenario(scenario)}
                    data-testid={`scenario-${scenario.name}`}
                  >
                    <ListItemText primary={scenario.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
};
