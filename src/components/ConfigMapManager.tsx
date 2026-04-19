import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
  ContentPaste as PasteIcon,
  ContentCopy as CopyIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { useRouteStore } from '../store';
import { storageService } from '../services';

export const ConfigMapManager: React.FC = () => {
  const { routes, setRoutes } = useRouteStore();
  const [exportFormat, setExportFormat] = useState<'yaml' | 'json'>('yaml');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [configmapName, setConfigmapName] = useState('openhqm-routes');
  const [configmapNamespace, setConfigmapNamespace] = useState('openhqm');

  const generateExport = (format?: 'yaml' | 'json') => {
    const fmt = format || exportFormat;
    try {
      const content =
        fmt === 'yaml'
          ? storageService.exportToYAML(routes)
          : storageService.exportToJSON(routes);
      return content;
    } catch (err: unknown) {
      setError(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
      return '';
    }
  };

  const handlePreview = () => {
    const content = generateExport();
    setPreview(content);
    setError('');
  };

  const handleDownload = () => {
    try {
      const content = generateExport();
      const filename = exportFormat === 'yaml' ? 'openhqm-routes.yaml' : 'openhqm-routes.json';
      const mimeType = exportFormat === 'yaml' ? 'text/yaml' : 'application/json';
      storageService.downloadFile(content, filename, mimeType);
      setError('');
      setExportDialogOpen(false);
    } catch (err: unknown) {
      setError(`Download failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const content = preview || generateExport();
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err: unknown) {
      setError(`Copy failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedRoutes = storageService.importFromYAML(content);
        setRoutes(importedRoutes);
        setError('');
        setImportError('');
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (err: unknown) {
        setError(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsText(file);
  };

  const handleImportFromText = () => {
    try {
      const importedRoutes = storageService.importFromYAML(importContent);
      setRoutes(importedRoutes);
      setError('');
      setImportError('');
      setImportSuccess(true);
      setImportDialogOpen(false);
      setImportContent('');
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err: unknown) {
      setImportError(`Invalid ConfigMap format: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleOpenExportDialog = () => {
    setExportDialogOpen(true);
    handlePreview();
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
    setError('');
    setImportError('');
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportContent('');
    setImportError('');
  };

  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
  };

  React.useEffect(() => {
    if (routes.length > 0) {
      const content = generateExport();
      setPreview(content);
    } else {
      setPreview('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {copySuccess && (
        <Alert severity="success" sx={{ mb: 2 }} data-testid="copy-success-message">
          ConfigMap copied to clipboard!
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
          Import from File
          <input
            type="file"
            hidden
            accept=".yaml,.yml,.json"
            onChange={handleImportFile}
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

        <Box sx={{ flex: 1 }} />

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleOpenExportDialog}
          data-testid="export-button"
        >
          Export ConfigMap
        </Button>
      </Box>

      {routes.length > 0 && (
        <Box sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PreviewIcon />}
            onClick={handlePreview}
            data-testid="preview-configmap-button"
          >
            Preview
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CopyIcon />}
            onClick={handleCopyToClipboard}
            data-testid="copy-configmap-button"
          >
            Copy
          </Button>
        </Box>
      )}

      {preview && routes.length > 0 && (
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
          data-testid="configmap-preview"
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

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={handleCloseExportDialog}
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
              onChange={(_, val) => { if (val) { setExportFormat(val); handlePreview(); } }}
              size="small"
            >
              <ToggleButton value="yaml" data-testid="export-format-yaml">YAML</ToggleButton>
              <ToggleButton value="json" data-testid="export-format-json">JSON</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <TextField
              label="ConfigMap Name"
              value={configmapName}
              onChange={(e) => setConfigmapName(e.target.value)}
              size="small"
              data-testid="configmap-name-input"
              slotProps={{ htmlInput: { 'data-testid': 'configmap-name-input' } }}
            />
            <TextField
              label="Namespace"
              value={configmapNamespace}
              onChange={(e) => setConfigmapNamespace(e.target.value)}
              size="small"
              data-testid="configmap-namespace-input"
              slotProps={{ htmlInput: { 'data-testid': 'configmap-namespace-input' } }}
            />
          </Box>

          <Box sx={{ height: 300, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Editor
              height="100%"
              language={exportFormat}
              value={preview}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExportDialog}>Cancel</Button>
          <Button
            onClick={handleCopyToClipboard}
            startIcon={<CopyIcon />}
          >
            Copy
          </Button>
          <Button
            onClick={handleDownload}
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
            onChange={(e) => setImportContent(e.target.value)}
            placeholder="Paste ConfigMap YAML or routing configuration here..."
            slotProps={{ htmlInput: { 'data-testid': 'import-textarea' } }}
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
