import React, { useState, useMemo } from 'react';
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
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>('yaml');
  const [exportPreview, setExportPreview] = useState('');

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
      name: 'new-route',
      description: '',
      enabled: true,
      priority: 100,
      endpoint: '',
      method: 'POST',
      transform_type: 'passthrough',
    });
  };

  const generateConfigMap = (format: string) => {
    const configMap = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: 'openhqm-routes',
        namespace: 'openhqm',
        labels: { app: 'openhqm', component: 'router' },
      },
      data: {
        'routes.yaml': yaml.dump({ version: '1.0', routes }),
      },
    };
    return format === 'json' ? JSON.stringify(configMap, null, 2) : yaml.dump(configMap);
  };

  const handleOpenExport = () => {
    const preview = generateConfigMap(exportFormat);
    setExportPreview(preview);
    setExportDialogOpen(true);
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

  const handleOpenImport = () => {
    setImportContent('');
    setImportError('');
    setImportSuccess(false);
    setImportDialogOpen(true);
  };

  const handleImportConfirm = () => {
    try {
      const parsed = yaml.load(importContent) as Record<string, unknown>;
      let importedRoutes: Route[] = [];

      if (parsed && typeof parsed === 'object') {
        if ('data' in parsed && typeof (parsed as Record<string, unknown>).data === 'object') {
          const data = (parsed as Record<string, Record<string, string>>).data;
          const routesYaml = data['routes.yaml'] || data['routing.yaml'];
          if (routesYaml) {
            const inner = yaml.load(routesYaml) as Record<string, unknown>;
            if (inner && Array.isArray((inner as Record<string, unknown>).routes)) {
              importedRoutes = (inner as Record<string, Route[]>).routes;
            }
          }
        } else if (Array.isArray((parsed as Record<string, unknown>).routes)) {
          importedRoutes = (parsed as Record<string, Route[]>).routes;
        } else if ('version' in parsed && 'routes' in parsed) {
          importedRoutes = (parsed as Record<string, Route[]>).routes;
        }
      }

      if (importedRoutes.length === 0) {
        setImportError('Invalid ConfigMap format: no routes found');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setRoutes([...routes, ...importedRoutes.map((r: any) => ({
        name: r.name || r.id || 'imported-route',
        description: r.description || '',
        enabled: r.enabled !== false,
        priority: r.priority ?? 100,
        endpoint: r.endpoint || r.destination?.endpoint || '',
        method: r.method || 'POST',
        transform_type: r.transform_type || 'passthrough',
        transform: r.transform || '',
        match_field: r.match_field || '',
        match_value: r.match_value || '',
        match_pattern: r.match_pattern || '',
      } as Route))]);

      setImportDialogOpen(false);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 5000);
    } catch {
      setImportError('Invalid ConfigMap format: could not parse YAML');
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
        maxWidth="md"
        fullWidth
        data-testid="export-dialog"
      >
        <DialogTitle>Export ConfigMap</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Format</Typography>
            <ToggleButtonGroup
              value={exportFormat}
              exclusive
              onChange={(_, val) => {
                if (val) {
                  setExportFormat(val);
                  setExportPreview(generateConfigMap(val));
                }
              }}
              size="small"
            >
              <ToggleButton value="yaml" data-testid="export-format-yaml">YAML</ToggleButton>
              <ToggleButton value="json" data-testid="export-format-json">JSON</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box
            data-testid="configmap-preview"
            sx={{ height: 300, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'auto' }}
          >
            <pre style={{ margin: 0, padding: '8px 12px', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
              {exportPreview}
            </pre>
          </Box>
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
      >
        <DialogTitle>Import ConfigMap</DialogTitle>
        <DialogContent>
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
            rows={15}
            fullWidth
            value={importContent}
            onChange={(e) => { setImportContent(e.target.value); setImportError(''); }}
            placeholder="Paste ConfigMap YAML or routing configuration here..."
            slotProps={{ htmlInput: { 'data-testid': 'import-textarea' } }}
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleImportConfirm}
            variant="contained"
            disabled={!importContent.trim()}
            data-testid="import-confirm-button"
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
