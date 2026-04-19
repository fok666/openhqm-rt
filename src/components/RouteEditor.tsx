import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRouteStore } from '../store';
import type { Route, RouteCondition, RouteAction } from '../types';

interface Condition {
  type: string;
  field: string;
  operator: string;
  value: string;
}

export const RouteEditor: React.FC = () => {
  const { selectedRoute, updateRoute } = useRouteStore();
  const [localRoute, setLocalRoute] = useState<Route | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [conditionOperator, setConditionOperator] = useState<string>('AND');
  const [transformEnabled, setTransformEnabled] = useState(false);
  const originalNameRef = useRef<string>('');

  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    setLocalRoute(selectedRoute);
    setValidationError('');
    setShowSuccess(false);
    if (selectedRoute) {
      originalNameRef.current = selectedRoute.name;
      setTransformEnabled(
        selectedRoute.transform_type !== undefined &&
        selectedRoute.transform_type !== 'passthrough'
      );
      // Load conditions from route
      setConditions(
        (selectedRoute.conditions || []).map((c) => ({
          type: c.type || 'payload',
          field: c.field,
          operator: c.operator,
          value: c.value || '',
        }))
      );
      setConditionOperator(selectedRoute.conditionOperator || 'AND');
    } else {
      setConditions([]);
      setConditionOperator('AND');
    }
  }, [selectedRoute]);

  if (!localRoute) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography>Select a route to edit</Typography>
      </Box>
    );
  }

  const handleUpdate = (updates: Partial<Route>) => {
    const updated = { ...localRoute, ...updates };
    setLocalRoute(updated);
    setValidationError('');
    // Persist to store so state survives tab switches
    const currentName = originalNameRef.current;
    isInternalUpdate.current = true;
    updateRoute(currentName, updates);
    if (updates.name !== undefined) {
      originalNameRef.current = updates.name;
    }
  };

  const handleSave = () => {
    if (!localRoute.name || localRoute.name.trim() === '') {
      setValidationError('Route name is required');
      return;
    }

    const routeConditions: RouteCondition[] = conditions
      .filter((c) => c.field)
      .map((c) => ({ type: c.type as RouteCondition['type'], field: c.field, operator: c.operator, value: c.value }));

    updateRoute(originalNameRef.current, {
      ...localRoute,
      conditions: routeConditions.length > 0 ? routeConditions : undefined,
      conditionOperator: routeConditions.length > 1 ? conditionOperator as 'AND' | 'OR' : undefined,
    });
    originalNameRef.current = localRoute.name;
    setValidationError('');
    setShowSuccess(true);
  };

  const handleAddCondition = () => {
    const newConditions = [...conditions, { type: 'payload', field: '', operator: 'equals', value: '' }];
    setConditions(newConditions);
    syncConditionsToStore(newConditions, conditionOperator);
  };

  const handleUpdateCondition = (index: number, updates: Partial<Condition>) => {
    const updated = conditions.map((c, i) => (i === index ? { ...c, ...updates } : c));
    setConditions(updated);
    syncConditionsToStore(updated, conditionOperator);
  };

  const syncConditionsToStore = (conds: Condition[], operator: string) => {
    const routeConditions = conds
      .filter((c) => c.field)
      .map((c) => ({ type: c.type as 'payload' | 'header' | 'metadata', field: c.field, operator: c.operator, value: c.value }));
    isInternalUpdate.current = true;
    updateRoute(originalNameRef.current, { conditions: routeConditions, conditionOperator: operator as 'AND' | 'OR' });
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleToggleTransform = () => {
    const newEnabled = !transformEnabled;
    setTransformEnabled(newEnabled);
    if (newEnabled) {
      handleUpdate({ transform_type: 'jq' });
    } else {
      handleUpdate({ transform_type: 'passthrough', transform: '' });
    }
  };

  return (
    <Paper data-testid="route-editor" sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Route Configuration
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Basic Information
        </Typography>
        <TextField
          label="Name"
          id="route-name-input"
          value={localRoute.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          fullWidth
          margin="normal"
          required
          slotProps={{ htmlInput: { 'data-testid': 'route-name-input', 'aria-required': 'true', 'aria-describedby': 'route-name-help' }, formHelperText: { id: 'route-name-help' } }}
          helperText="Unique identifier for this route"
        />
        <TextField
          label="Description"
          value={localRoute.description || ''}
          onChange={(e) => handleUpdate({ description: e.target.value })}
          fullWidth
          margin="normal"
          multiline
          rows={2}
          slotProps={{ htmlInput: { 'data-testid': 'route-description-input' } }}
        />
        <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
          <TextField
            label="Priority"
            type="number"
            value={localRoute.priority ?? 100}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              handleUpdate({ priority: isNaN(val) ? 100 : val });
            }}
            sx={{ flex: 1 }}
            slotProps={{ htmlInput: { 'data-testid': 'route-priority-input' } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={localRoute.enabled !== false}
                onChange={(e) => handleUpdate({ enabled: e.target.checked })}
              />
            }
            label="Enabled"
          />
          <FormControlLabel
            control={
              <Switch
                checked={localRoute.is_default || false}
                onChange={(e) => handleUpdate({ is_default: e.target.checked })}
              />
            }
            label="Default Route"
          />
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Conditions
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddCondition}
            data-testid="add-condition-button"
          >
            Add Condition
          </Button>
        </Box>

        {conditions.length > 1 && (
          <Box sx={{ mb: 2 }}>
            <select
              value={conditionOperator}
              onChange={(e) => { setConditionOperator(e.target.value); syncConditionsToStore(conditions, e.target.value); }}
              data-testid="condition-operator"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </Box>
        )}

        {conditions.map((condition, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
            <select
              value={condition.type}
              onChange={(e) => handleUpdateCondition(index, { type: e.target.value })}
              data-testid="condition-type-select"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="payload">payload</option>
              <option value="header">header</option>
              <option value="metadata">metadata</option>
            </select>
            <TextField
              size="small"
              label="Field"
              value={condition.field}
              onChange={(e) => handleUpdateCondition(index, { field: e.target.value })}
              sx={{ flex: 2 }}
              slotProps={{ htmlInput: { 'data-testid': 'condition-field-input' } }}
            />
            <select
              value={condition.operator}
              onChange={(e) => handleUpdateCondition(index, { operator: e.target.value })}
              data-testid="condition-operator-select"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '80px' }}
            >
              <option value="equals">equals</option>
              <option value="contains">contains</option>
              <option value="regex">regex</option>
              <option value="exists">exists</option>
              <option value="gt">gt</option>
              <option value="lt">lt</option>
            </select>
            <TextField
              size="small"
              label="Value"
              value={condition.value}
              onChange={(e) => handleUpdateCondition(index, { value: e.target.value })}
              sx={{ flex: 2 }}
              slotProps={{ htmlInput: { 'data-testid': 'condition-value-input' } }}
            />
            <IconButton size="small" onClick={() => handleRemoveCondition(index)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}

        {conditions.length === 0 && (
          <>
            <TextField
              label="Match Field"
              value={localRoute.match_field || ''}
              onChange={(e) => handleUpdate({ match_field: e.target.value })}
              fullWidth
              margin="normal"
              placeholder="e.g., metadata.type, payload.action"
              slotProps={{ htmlInput: { 'data-testid': 'match-field-input' } }}
            />
            <TextField
              label="Match Value"
              value={localRoute.match_value || ''}
              onChange={(e) => handleUpdate({ match_value: e.target.value })}
              fullWidth
              margin="normal"
              placeholder="Exact value to match"
              slotProps={{ htmlInput: { 'data-testid': 'match-value-input' } }}
            />
            <TextField
              label="Match Pattern (Regex)"
              value={localRoute.match_pattern || ''}
              onChange={(e) => handleUpdate({ match_pattern: e.target.value })}
              fullWidth
              margin="normal"
              placeholder="e.g., ^notification\\."
              slotProps={{ htmlInput: { 'data-testid': 'match-pattern-input' } }}
            />
          </>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Destination
        </Typography>
        <TextField
          label="Endpoint"
          value={localRoute.endpoint}
          onChange={(e) => handleUpdate({ endpoint: e.target.value })}
          fullWidth
          margin="normal"
          placeholder="e.g., user-service, http://api.example.com"
          slotProps={{ htmlInput: { 'data-testid': 'destination-endpoint-input' } }}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>HTTP Method</InputLabel>
          <Select
            value={localRoute.method || 'POST'}
            onChange={(e) => handleUpdate({ method: e.target.value })}
            label="HTTP Method"
          >
            <MenuItem value="GET">GET</MenuItem>
            <MenuItem value="POST">POST</MenuItem>
            <MenuItem value="PUT">PUT</MenuItem>
            <MenuItem value="PATCH">PATCH</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Transformation
          </Typography>
          <Switch
            checked={transformEnabled}
            onChange={handleToggleTransform}
            data-testid="enable-transform-toggle"
          />
        </Box>
        {transformEnabled && (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel>Transform Type</InputLabel>
              <Select
                value={localRoute.transform_type || 'jq'}
                onChange={(e) => handleUpdate({ transform_type: e.target.value as Route['transform_type'] })}
                label="Transform Type"
              >
                <MenuItem value="jq">JQ</MenuItem>
                <MenuItem value="template">Template</MenuItem>
                <MenuItem value="jsonpath">JSONPath</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Transform Expression
              </Typography>
              <Box
                data-testid="jq-expression-editor"
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <textarea
                  value={localRoute.transform || ''}
                  onChange={(e) => handleUpdate({ transform: e.target.value })}
                  style={{
                    width: '100%',
                    height: '200px',
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
                  }}
                  spellCheck={false}
                />
              </Box>
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
                data-testid="test-transform-button"
              >
                Test Transform
              </Button>
            </Box>
          </>
        )}
        {!transformEnabled && (
          <FormControl fullWidth margin="normal">
            <InputLabel>Transform Type</InputLabel>
            <Select value="passthrough" label="Transform Type" disabled>
              <MenuItem value="passthrough">Passthrough</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
          <TextField
            label="Timeout (seconds)"
            type="number"
            value={localRoute.timeout || ''}
            onChange={(e) => handleUpdate({ timeout: parseInt(e.target.value) || undefined })}
            sx={{ flex: 1 }}
            placeholder="30"
          />
          <TextField
            label="Max Retries"
            type="number"
            value={localRoute.max_retries || ''}
            onChange={(e) => handleUpdate({ max_retries: parseInt(e.target.value) || undefined })}
            sx={{ flex: 1 }}
            placeholder="3"
          />
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Actions
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              const actions = [...(localRoute.actions || []), { type: 'log' }];
              handleUpdate({ actions });
            }}
            data-testid="add-action-button"
          >
            Add Action
          </Button>
        </Box>
        {(localRoute.actions || []).map((action, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
            <select
              value={action.type}
              onChange={(e) => {
                const actions = [...(localRoute.actions || [])];
                actions[index] = { ...actions[index], type: e.target.value };
                handleUpdate({ actions });
              }}
              data-testid="action-type-select"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="log">log</option>
              <option value="notify">notify</option>
              <option value="metric">metric</option>
            </select>
            <TextField
              size="small"
              label="Key"
              value={Object.keys(action).find(k => k !== 'type') || ''}
              onChange={(e) => {
                const actions = [...(localRoute.actions || [])];
                const oldKey = Object.keys(actions[index]).find(k => k !== 'type') || '';
                const val = oldKey ? actions[index][oldKey] : '';
                const newAction = { type: actions[index].type } as Record<string, string> & { type: string };
                if (e.target.value) newAction[e.target.value] = val || '';
                actions[index] = newAction as RouteAction;
                handleUpdate({ actions });
              }}
              sx={{ flex: 1 }}
              slotProps={{ htmlInput: { 'data-testid': 'action-key-input' } }}
            />
            <TextField
              size="small"
              label="Value"
              value={(() => {
                const key = Object.keys(action).find(k => k !== 'type');
                return key ? action[key] : '';
              })()}
              onChange={(e) => {
                const actions = [...(localRoute.actions || [])];
                const key = Object.keys(actions[index]).find(k => k !== 'type') || 'value';
                actions[index] = { ...actions[index], [key]: e.target.value };
                handleUpdate({ actions });
              }}
              sx={{ flex: 1 }}
              slotProps={{ htmlInput: { 'data-testid': 'action-value-input' } }}
            />
            <IconButton
              size="small"
              onClick={() => {
                const actions = (localRoute.actions || []).filter((_, i) => i !== index);
                handleUpdate({ actions });
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 3 }} />

      {validationError && (
        <Alert severity="error" data-testid="validation-error" role="alert" aria-live="assertive" sx={{ mb: 2 }}>
          {validationError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          data-testid="save-route-button"
        >
          Save Route
        </Button>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          onClose={() => setShowSuccess(false)}
          data-testid="save-success-message"
          role="status"
          aria-live="polite"
        >
          Route saved successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
};
