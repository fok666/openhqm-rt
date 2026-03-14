import React from 'react';
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
} from '@mui/material';
import { Delete as DeleteIcon, ContentCopy as CopyIcon, Add as AddIcon } from '@mui/icons-material';
import { useRouteStore } from '../store';
import type { Route } from '../types';

export const RouteList: React.FC = () => {
  const { routes, selectedRoute, selectRoute, deleteRoute, duplicateRoute, updateRoute, addRoute } =
    useRouteStore();

  const handleToggleEnabled = (route: Route, event: React.MouseEvent) => {
    event.stopPropagation();
    updateRoute(route.name, { enabled: !route.enabled });
  };

  const handleDelete = (name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this route?')) {
      deleteRoute(name);
    }
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
      </Box>

      <List data-testid="route-list" sx={{ flexGrow: 1, overflow: 'auto' }} role="list">
        {routes.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">No routes yet. Create your first route!</Typography>
          </Box>
        ) : (
          routes.map((route) => (
            <ListItem
              key={route.name}
              data-testid={`route-item-${route.name}`}
              secondaryAction={
                <Box>
                  <Switch
                    edge="end"
                    checked={route.enabled !== false} // defaults to true
                    onClick={(e) => handleToggleEnabled(route, e)}
                    size="small"
                    data-testid="toggle-enabled"
                    inputProps={{ 'aria-label': 'Toggle route enabled' }}
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
                    onClick={(e) => handleDelete(route.name, e)}
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
    </Paper>
  );
};
