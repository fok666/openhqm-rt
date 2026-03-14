import React, { useEffect } from 'react';
import {
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Alert,
  Snackbar,
} from '@mui/material';
import { RouteList, RouteEditor, JQPlayground, Simulator, ConfigMapManager } from './components';
import { useRouteStore } from './store';
import { jqService } from './services';
import { settings } from './config/settings';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  const { loadRoutes, error, clearError } = useRouteStore();
  const [currentTab, setCurrentTab] = React.useState(0);
  const [jqInitialized, setJqInitialized] = React.useState(false);

  useEffect(() => {
    // Initialize JQ engine
    jqService.init().then(() => {
      setJqInitialized(true);
      console.log('JQ engine initialized');
    });

    // Load routes from localStorage
    loadRoutes();
  }, [loadRoutes]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        data-testid="app-container"
        sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}
      >
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
              {settings.app.name} v{settings.app.version}
            </Typography>
          </Toolbar>
        </AppBar>

        {!jqInitialized && (
          <Alert severity="info" sx={{ m: 2 }}>
            Initializing JQ engine...
          </Alert>
        )}

        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <Tab label="Route Editor" data-testid="route-editor-tab" />
          <Tab label="JQ Playground" data-testid="jq-playground-tab" />
          <Tab label="Simulator" data-testid="simulator-tab" />
          <Tab label="Export/Import" data-testid="configmap-tab" />
        </Tabs>

        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          {currentTab === 0 && (
            <>
              <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', overflow: 'hidden' }}>
                <RouteList />
              </Box>
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <RouteEditor />
              </Box>
            </>
          )}

          {currentTab === 1 && (
            <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
              <JQPlayground />
            </Box>
          )}

          {currentTab === 2 && (
            <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
              <Simulator />
            </Box>
          )}

          {currentTab === 3 && (
            <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
              <ConfigMapManager />
            </Box>
          )}
        </Box>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={clearError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={clearError} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
