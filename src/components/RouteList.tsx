import React, { useState, useMemo, useRef } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Chip,
  Typography,
  Paper,
  Button,
  Switch,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import yaml from 'js-yaml';
import { useRouteStore } from '../store';
import type { Route } from '../types';

export const RouteList: React.FC = () => {
  const { routes, selectedRoute, selectRoute, deleteRoute, duplicateRoute, updateRoute, addRoute, setRoutes } =
    useRouteStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>('yaml');
  const [exportPreview, setExportPreview] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [configMapName, setConfigMapName] = useState('openhqm-routes');
  const [configMapNamespace, setConfigMapNamespace] = useState('openhqm');
  const [customLabels, setCustomLabels] = useState<{ key: string; value: string }[]>([]);
  const [customAnnotations, setCustomAnnotations] = useState<{ key: string; value: string }[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [importTab, setImportTab] = useState(0);
  const [importHistory, setImportHistory] = useState<{ name: string; date: string; count: number }[]>([]);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingImportRoutes, setPendingImportRoutes] = useState<Route[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100));
  }, [routes]);

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return sortedRoutes;
    const query = searchQuery.toLowerCase();
    return sortedRoutes.filter(
      (route) =>
        route.name.toLowerCase().includes(query) ||
        (route.description || '').toLowerCase().includes(query) ||
        (route.endpoint || '').toLowerCase().includes(query)
    );
  }, [sortedRoutes, searchQuery]);

  const handleToggleEnabled = (route: Route, event: React.MouseEvent) => {
    event.stopPropagation();
    updateRoute(route.name, { enabled: !route.enabled });
  };

  const handleDeleteClick = (name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setRouteToDelete(name);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (routeToDelete) {
      deleteRoute(routeToDelete);
    }
    setDeleteDialogOpen(false);
    setRouteToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setRouteToDelete(null);
  };

  const handleDuplicate = (name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    duplicateRoute(name);
  };

  const handleNewRoute = () => {
    addRoute({
      name: '',
      description: '',
      enabled: true,
      priority: 100,
      endpoint: '',
      method: 'POST',
      transform_type: 'passthrough',
    });
  };

  const generateConfigMap = (format: string) => {
    const labels: Record<string, string> = { app: 'openhqm', component: 'router' };
    customLabels.forEach((l) => {
      if (l.key) labels[l.key] = l.value;
    });
    const annotations: Record<string, string> = { managedBy: 'router-manager' };
    customAnnotations.forEach((a) => {
      if (a.key) annotations[a.key] = a.value;
    });
    // Map routes to OpenHQM-compatible format
    const exportRoutes = routes.map((route) => {
      const exportRoute: Record<string, unknown> = {
        name: route.name,
        endpoint: route.endpoint,
      };
      if (route.description) exportRoute.description = route.description;
      if (route.priority !== undefined) exportRoute.priority = route.priority;
      if (route.enabled === false) exportRoute.enabled = false;
      if (route.method) exportRoute.method = route.method;
      if (route.match_field) exportRoute.match_field = route.match_field;
      if (route.match_value) exportRoute.match_value = route.match_value;
      if (route.match_pattern) exportRoute.match_pattern = route.match_pattern;
      if (route.conditions && route.conditions.length > 0) {
        exportRoute.conditions = route.conditions;
        if (route.conditionOperator) exportRoute.conditionOperator = route.conditionOperator;
      }
      if (route.transform_type && route.transform_type !== 'passthrough') {
        exportRoute.transform = {
          type: route.transform_type,
          jqExpression: route.transform,
        };
      }
      if (route.actions && route.actions.length > 0) {
        exportRoute.actions = route.actions;
      }
      if (route.header_mappings) exportRoute.header_mappings = route.header_mappings;
      if (route.timeout) exportRoute.timeout = route.timeout;
      if (route.max_retries) exportRoute.max_retries = route.max_retries;
      return exportRoute;
    });
    const configMap = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: configMapName,
        namespace: configMapNamespace,
        labels,
        annotations,
      },
      data: {
        'routes.yaml': yaml.dump({ version: '1.0', routes: exportRoutes }, { quotingType: '"' }),
      },
    };
    return format === 'json' ? JSON.stringify(configMap, null, 2) : yaml.dump(configMap);
  };

  const handleOpenExport = () => {
    setImportDialogOpen(false);
    setPreviewVisible(false);
    setExportPreview('');
    setCopySuccess(false);
    setExportDialogOpen(true);
  };

  const handlePreview = () => {
    const content = generateConfigMap(exportFormat);
    setExportPreview(content);
    setPreviewVisible(true);
  };

  const handleExportDownload = () => {
    const content = generateConfigMap(exportFormat);
    const ext = exportFormat === 'json' ? 'json' : 'yaml';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openhqm-routes.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyConfigMap = async () => {
    try {
      await navigator.clipboard.writeText(exportPreview);
    } catch {
      // fallback
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizeRoute = (r: any): Route => ({
    name: r.name || r.id || 'imported-route',
    description: r.description || '',
    enabled: r.enabled !== false,
    priority: r.priority ?? 100,
    endpoint: r.endpoint || r.destination?.endpoint || '',
    method: r.method || 'POST',
    transform_type: r.transform_type || r.transform?.type || 'passthrough',
    transform: r.transform?.jqExpression || (typeof r.transform === 'string' ? r.transform : '') || '',
    match_field: r.match_field || '',
    match_value: r.match_value || '',
    match_pattern: r.match_pattern || '',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractRoutes = (parsed: any): any[] => {
    if (!parsed || typeof parsed !== 'object') return [];
    if ('data' in parsed && typeof parsed.data === 'object') {
      const data = parsed.data;
      const routesYaml = data['routes.yaml'] || data['routing.yaml'];
      if (routesYaml) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inner = yaml.load(routesYaml) as any;
        if (inner && Array.isArray(inner.routes)) return inner.routes;
      }
    } else if (Array.isArray(parsed.routes)) {
      return parsed.routes;
    } else if ('version' in parsed && 'routes' in parsed) {
      return parsed.routes;
    }
    return [];
  };

  const finalizeImport = (normalizedRoutes: Route[], replace: boolean) => {
    if (replace) {
      const newNames = new Set(normalizedRoutes.map((r) => r.name));
      const filtered = routes.filter((r) => !newNames.has(r.name));
      setRoutes([...filtered, ...normalizedRoutes]);
    } else {
      setRoutes([...routes, ...normalizedRoutes]);
    }
    setImportHistory((prev) => [
      ...prev,
      { name: `Import ${prev.length + 1}`, date: new Date().toISOString(), count: normalizedRoutes.length },
    ]);
    setImportDialogOpen(false);
    setConflictDialogOpen(false);
    setImportSuccess(true);
    setTimeout(() => setImportSuccess(false), 5000);
  };

  const handleOpenImport = () => {
    setExportDialogOpen(false);
    setImportContent('');
    setImportError('');
    setImportSuccess(false);
    setImportTab(0);
    setSelectedFile(null);
    setImportDialogOpen(true);
  };

  const handleImportConfirm = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = yaml.load(importContent) as any;
      const rawRoutes = extractRoutes(parsed);

      if (rawRoutes.length === 0) {
        setImportError('Invalid ConfigMap format: no routes found');
        return;
      }

      const normalized = rawRoutes.map(normalizeRoute);
      const conflicts = normalized.filter((r) => routes.some((existing) => existing.name === r.name));
      if (conflicts.length > 0) {
        setPendingImportRoutes(normalized);
        setConflictDialogOpen(true);
        return;
      }

      finalizeImport(normalized, false);
    } catch {
      setImportError('Invalid ConfigMap format: could not parse YAML');
    }
  };

  const handleReplaceExisting = () => {
    finalizeImport(pendingImportRoutes, true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleFileImport = async () => {
    if (!selectedFile) return;
    try {
      const content = await selectedFile.text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = yaml.load(content) as any;
      const rawRoutes = extractRoutes(parsed);
      if (rawRoutes.length === 0) {
        setImportError('Invalid ConfigMap format: no routes found');
        return;
      }
      finalizeImport(rawRoutes.map(normalizeRoute), false);
    } catch {
      setImportError('Invalid file format');
    }
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Routes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          fullWidth
          onClick={handleNewRoute}
          data-testid="new-route-button"
          aria-label="Create new route"
        >
          New Route
        </Button>
        <TextField
          size="small"
          fullWidth
          placeholder="Search routes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mt: 1 }}
          slotProps={{
            htmlInput: { 'data-testid': 'route-search-input' },
            input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> },
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleOpenExport}
            data-testid="export-button"
            aria-label="Export routes"
            sx={{ flex: 1 }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadIcon />}
            onClick={handleOpenImport}
            data-testid="import-button"
            aria-label="Import routes"
            sx={{ flex: 1 }}
          >
            Import
          </Button>
        </Box>
      </Box>

      {importSuccess && (
        <Alert severity="success" sx={{ mx: 2, mt: 1 }} data-testid="import-success-message">
          Routes imported successfully!
        </Alert>
      )}

      <Box data-testid="route-statistics" sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary">
          Total: <span data-testid="total-routes">{routes.length}</span> routes
          {routes.filter(r => r.enabled !== false).length !== routes.length && (
            <> ({routes.filter(r => r.enabled !== false).length} enabled)</>
          )}
        </Typography>
      </Box>

      <List data-testid="route-list" sx={{ flexGrow: 1, overflow: 'auto' }} role="list">
        {filteredRoutes.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              {routes.length === 0 ? 'No routes yet. Create your first route!' : 'No routes match your search.'}
            </Typography>
          </Box>
        ) : (
          filteredRoutes.map((route) => (
            <ListItem
              key={route.name}
              role="listitem"
              data-testid={`route-item-${route.name}`}
              secondaryAction={
                <Box>
                  <Switch
                    edge="end"
                    checked={route.enabled !== false}
                    onClick={(e) => handleToggleEnabled(route, e)}
                    size="small"
                    data-testid="toggle-enabled"
                    slotProps={{ input: { 'aria-label': 'Toggle route enabled' } }}
                  />
                  <IconButton
                    edge="end"
                    onClick={(e) => handleDuplicate(route.name, e)}
                    size="small"
                    data-testid="duplicate-button"
                    aria-label="Duplicate route"
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={(e) => handleDeleteClick(route.name, e)}
                    size="small"
                    data-testid="delete-button"
                    aria-label="Delete route"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
              disablePadding
            >
              <ListItemButton
                selected={selectedRoute?.name === route.name}
                onClick={() => selectRoute(route)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {route.name}
                      <Chip
                        label={`P${route.priority || 100}`}
                        size="small"
                        className={route.enabled !== false ? 'enabled' : 'disabled'}
                        data-testid="route-enabled-indicator"
                      />
                    </Box>
                  }
                  secondary={route.description || route.endpoint}
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>

      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Route</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the route "{routeToDelete}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" data-testid="confirm-delete-button">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        data-testid="export-dialog"
        hideBackdrop
        disableScrollLock
        disableEnforceFocus
        disableAutoFocus
        sx={{
          pointerEvents: 'none',
          '& .MuiDialog-paper': { pointerEvents: 'auto' },
        }}
      >
        <DialogTitle>Export ConfigMap</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 }}>
            <TextField
              label="ConfigMap Name"
              size="small"
              value={configMapName}
              onChange={(e) => setConfigMapName(e.target.value)}
              slotProps={{ htmlInput: { 'data-testid': 'configmap-name-input' } }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Namespace"
              size="small"
              value={configMapNamespace}
              onChange={(e) => setConfigMapNamespace(e.target.value)}
              slotProps={{ htmlInput: { 'data-testid': 'configmap-namespace-input' } }}
              sx={{ flex: 1 }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setCustomLabels((prev) => [...prev, { key: '', value: '' }])}
              data-testid="add-label-button"
            >
              Add Label
            </Button>
            {customLabels.map((label, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField
                  size="small"
                  placeholder="Key"
                  value={label.key}
                  onChange={(e) => {
                    const updated = [...customLabels];
                    updated[index].key = e.target.value;
                    setCustomLabels(updated);
                  }}
                  slotProps={{ htmlInput: { 'data-testid': 'label-key-input' } }}
                />
                <TextField
                  size="small"
                  placeholder="Value"
                  value={label.value}
                  onChange={(e) => {
                    const updated = [...customLabels];
                    updated[index].value = e.target.value;
                    setCustomLabels(updated);
                  }}
                  slotProps={{ htmlInput: { 'data-testid': 'label-value-input' } }}
                />
              </Box>
            ))}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setCustomAnnotations((prev) => [...prev, { key: '', value: '' }])}
              data-testid="add-annotation-button"
            >
              Add Annotation
            </Button>
            {customAnnotations.map((annotation, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField
                  size="small"
                  placeholder="Key"
                  value={annotation.key}
                  onChange={(e) => {
                    const updated = [...customAnnotations];
                    updated[index].key = e.target.value;
                    setCustomAnnotations(updated);
                  }}
                  slotProps={{ htmlInput: { 'data-testid': 'annotation-key-input' } }}
                />
                <TextField
                  size="small"
                  placeholder="Value"
                  value={annotation.value}
                  onChange={(e) => {
                    const updated = [...customAnnotations];
                    updated[index].value = e.target.value;
                    setCustomAnnotations(updated);
                  }}
                  slotProps={{ htmlInput: { 'data-testid': 'annotation-value-input' } }}
                />
              </Box>
            ))}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Format</Typography>
            <ToggleButtonGroup
              value={exportFormat}
              exclusive
              onChange={(_, val) => { if (val) setExportFormat(val); }}
              size="small"
            >
              <ToggleButton value="yaml" data-testid="export-format-yaml">YAML</ToggleButton>
              <ToggleButton value="json" data-testid="export-format-json">JSON</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Button
            variant="outlined"
            onClick={handlePreview}
            data-testid="preview-configmap-button"
            sx={{ mb: 2 }}
          >
            Preview ConfigMap
          </Button>

          {previewVisible && (
            <>
              <Box
                data-testid="configmap-preview"
                sx={{ height: 300, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'auto', mb: 1 }}
              >
                <pre style={{ margin: 0, padding: '8px 12px', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                  {exportPreview}
                </pre>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<CopyIcon />}
                  onClick={handleCopyConfigMap}
                  data-testid="copy-configmap-button"
                >
                  Copy to Clipboard
                </Button>
                {copySuccess && (
                  <Alert severity="success" sx={{ py: 0 }} data-testid="copy-success-message">
                    Copied!
                  </Alert>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExportDownload}
            variant="contained"
            startIcon={<DownloadIcon />}
            data-testid="export-download-button"
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
        data-testid="import-dialog"
        slotProps={{ paper: { 'data-testid': 'import-dialog-paper' } as Record<string, string> }}
        aria-labelledby="import-dialog-title"
      >
        <DialogTitle id="import-dialog-title">Import ConfigMap</DialogTitle>
        <DialogContent>
          <Tabs value={importTab} onChange={(_, val) => setImportTab(val)} sx={{ mb: 2 }}>
            <Tab label="Paste YAML" />
            <Tab label="Import History" data-testid="import-history-tab" />
          </Tabs>

          {importTab === 0 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Paste your ConfigMap YAML or routing configuration below
              </Typography>
              {importError && (
                <Alert severity="error" sx={{ mb: 2 }} data-testid="import-error">
                  {importError}
                </Alert>
              )}
              <TextField
                multiline
                rows={12}
                fullWidth
                value={importContent}
                onChange={(e) => { setImportContent(e.target.value); setImportError(''); }}
                placeholder="Paste ConfigMap YAML or routing configuration here..."
                slotProps={{ htmlInput: { 'data-testid': 'import-textarea' } }}
                sx={{ fontFamily: 'monospace', mb: 2 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="file"
                  accept=".yaml,.yml,.json"
                  data-testid="import-file-input"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleFileImport}
                  disabled={!selectedFile}
                  data-testid="import-file-button"
                >
                  Import File
                </Button>
              </Box>
            </>
          )}

          {importTab === 1 && (
            <Box>
              {importHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No import history yet.</Typography>
              ) : (
                importHistory.map((entry, index) => (
                  <Box
                    key={index}
                    data-testid="import-history-item"
                    sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Typography variant="body2">{entry.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.count} route(s) - {new Date(entry.date).toLocaleString()}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          {importTab === 0 && (
            <Button
              onClick={handleImportConfirm}
              variant="contained"
              disabled={!importContent.trim()}
              data-testid="import-confirm-button"
            >
              Import
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Import Conflict Dialog */}
      <Dialog
        open={conflictDialogOpen}
        onClose={() => setConflictDialogOpen(false)}
        data-testid="import-conflict-dialog"
      >
        <DialogTitle>Import Conflict</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Some routes being imported have the same name as existing routes.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConflictDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReplaceExisting}
            variant="contained"
            color="warning"
            data-testid="replace-existing-button"
          >
            Replace Existing
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
