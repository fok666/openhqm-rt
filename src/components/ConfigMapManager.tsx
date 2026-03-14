import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Alert, 
  Tabs, 
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Download as DownloadIcon, Upload as UploadIcon, ContentPaste as PasteIcon } from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { useRouteStore } from '../store';
import { storageService } from '../services';

export const ConfigMapManager: React.FC = () => {
  const { routes, setRoutes } = useRouteStore();
  const [exportFormat, setExportFormat] = useState<'yaml' | 'json'>('yaml');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExport = () => {
    try {
      const content =
        exportFormat === 'yaml'
          ? storageService.exportToYAML(routes)
          : storageService.exportToJSON(routes);

      setPreview(content);
      setError('');
    } catch (err: any) {
      setError(`Export failed: ${err.message}`);
    }
  };

  const handleDownload = () => {
    try {
      const content =
        preview ||
        (exportFormat === 'yaml'
          ? storageService.exportToYAML(routes)
          : storageService.exportToJSON(routes));

      const filename = exportFormat === 'yaml' ? 'openhqm-routes.yaml' : 'openhqm-routes.json';
      const mimeType = exportFormat === 'yaml' ? 'text/yaml' : 'application/json';

      storageService.downloadFile(content, filename, mimeType);
      setError('');
    } catch (err: any) {
      setError(`Download failed: ${err.message}`);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedRoutes = storageService.importFromYAML(content);
        setRoutes(importedRoutes);
        setError('');
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (err: any) {
        setError(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleImportFromText = () => {
    try {
      const importedRoutes = storageService.importFromYAML(importContent);
      setRoutes(importedRoutes);
      setError('');
      setImportSuccess(true);
      setImportDialogOpen(false);
      setImportContent('');
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err: any) {
      setError(`Import failed: ${err.message}`);
    }
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
    setError('');
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportContent('');
  };

  React.useEffect(() => {
    if (routes.length > 0) {
      handleExport();
    }
  }, [routes, exportFormat]);

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        ConfigMap Manager
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {importSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} data-testid="import-success-message">
          Routes imported successfully!
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadIcon />}
        >
          Import from File
          <input
            type="file"
            hidden
            accept=".yaml,.yml,.json"
            onChange={handleImport}
            data-testid="import-file-input"
          />
        </Button>

        <Button
          variant="outlined"
          startIcon={<PasteIcon />}
          onClick={handleOpenImportDialog}
          data-testid="import-button"
        >
          Paste ConfigMap
        </Button>

        <Tabs value={exportFormat} onChange={(_, v) => setExportFormat(v)}>
          <Tab label="YAML" value="yaml" />
          <Tab label="JSON" value="json" />
        </Tabs>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={routes.length === 0}
          data-testid="export-button"
        >
          Download ConfigMap
        </Button>
      </Box>

      {routes.length > 0 && (
        <Box
          data-testid="configmap-preview"
          sx={{
            flexGrow: 1,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <Editor
            height="100%"
            language={exportFormat}
            value={preview}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />
        </Box>
      )}

      {routes.length === 0 && (
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography>Create routes to generate ConfigMap</Typography>
        </Box>
      )}

      {/* Import Dialog */}
      <Dialog 
        open={importDialogOpen} 
        onClose={handleCloseImportDialog}
        maxWidth="md"
        fullWidth
        data-testid="import-dialog"
      >
        <DialogTitle>Import ConfigMap</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste your ConfigMap YAML or the routing.yaml content below
          </Typography>
          <TextField
            multiline
            rows={15}
            fullWidth
            value={importContent}
            onChange={(e) => setImportContent(e.target.value)}
            placeholder="Paste ConfigMap YAML or routing configuration here..."
            inputProps={{ 'data-testid': 'import-textarea' }}
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>Cancel</Button>
          <Button 
            onClick={handleImportFromText}
            variant="contained"
            disabled={!importContent.trim()}
            data-testid="import-submit-button"
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
