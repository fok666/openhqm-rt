import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { useRouteStore } from '../store';
import type { Route } from '../types';

export const RouteEditor: React.FC = () => {
  const { selectedRoute, updateRoute } = useRouteStore();
  const [localRoute, setLocalRoute] = useState<Route | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setLocalRoute(selectedRoute);
    setValidationError('');
    setShowSuccess(false);
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
  };

  const handleSave = () => {
    // Validate required fields
    if (!localRoute.name || localRoute.name.trim() === '') {
      setValidationError('Route name is required');
      return;
    }
    if (!localRoute.endpoint || localRoute.endpoint.trim() === '') {
      setValidationError('Endpoint is required');
      return;
    }

    // Save to store
    updateRoute(localRoute.name, localRoute);
    setValidationError('');
    setShowSuccess(true);
  };

  return (
    <Paper data-testid="route-editor" sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Route Configuration
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Basic Information */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Basic Information
        </Typography>
        <TextField
          label="Name"
          value={localRoute.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          fullWidth
          margin="normal"
          required
          inputProps={{ 'data-testid': 'route-name-input' }}
        />
        <TextField
          label="Description"
          value={localRoute.description || ''}
          onChange={(e) => handleUpdate({ description: e.target.value })}
          fullWidth
          margin="normal"
          multiline
          rows={2}
          inputProps={{ 'data-testid': 'route-description-input' }}
        />
        <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
          <TextField
            label="Priority"
            type="number"
            value={localRoute.priority || 100}
            onChange={(e) => handleUpdate({ priority: parseInt(e.target.value) || 100 })}
            sx={{ flex: 1 }}
            inputProps={{ 'data-testid': 'route-priority-input' }}
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

      {/* Matching Conditions */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Matching Conditions
        </Typography>
        <TextField
          label="Match Field"
          value={localRoute.match_field || ''}
          onChange={(e) => handleUpdate({ match_field: e.target.value })}
          fullWidth
          margin="normal"
          placeholder="e.g., metadata.type, payload.action"
          inputProps={{ 'data-testid': 'match-field-input' }}
        />
        <TextField
          label="Match Value"
          value={localRoute.match_value || ''}
          onChange={(e) => handleUpdate({ match_value: e.target.value })}
          fullWidth
          margin="normal"
          placeholder="Exact value to match"
          inputProps={{ 'data-testid': 'match-value-input' }}
        />
        <TextField
          label="Match Pattern (Regex)"
          value={localRoute.match_pattern || ''}
          onChange={(e) => handleUpdate({ match_pattern: e.target.value })}
          fullWidth
          margin="normal"
          placeholder="e.g., ^notification\\."
          inputProps={{ 'data-testid': 'match-pattern-input' }}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Destination */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Destination
        </Typography>
        <TextField
          label="Endpoint"
          value={localRoute.endpoint}
          onChange={(e) => handleUpdate({ endpoint: e.target.value })}
          fullWidth
          margin="normal"
          required
          placeholder="e.g., user-service, http://api.example.com"
          inputProps={{ 'data-testid': 'destination-endpoint-input' }}
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

      {/* Transformation */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Transformation
        </Typography>
        <FormControl fullWidth margin="normal">
          <InputLabel>Transform Type</InputLabel>
          <Select
            value={localRoute.transform_type || 'passthrough'}
            onChange={(e) => handleUpdate({ transform_type: e.target.value as any })}
            label="Transform Type"
          >
            <MenuItem value="passthrough">Passthrough</MenuItem>
            <MenuItem value="jq">JQ</MenuItem>
            <MenuItem value="template">Template</MenuItem>
            <MenuItem value="jsonpath">JSONPath</MenuItem>
          </Select>
        </FormControl>
        {localRoute.transform_type && localRoute.transform_type !== 'passthrough' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Transform Expression
            </Typography>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Editor
                height="200px"
                language="javascript"
                value={localRoute.transform || ''}
                onChange={(value) => handleUpdate({ transform: value || '' })}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Settings */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
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

      {validationError && (
        <Alert severity="error" data-testid="validation-error" sx={{ mb: 2 }}>
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
        >
          Route saved successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
};
