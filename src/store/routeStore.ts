import { create } from 'zustand';
import type { Route } from '../types';
import { storageService } from '../services';

interface RouteStore {
  routes: Route[];
  selectedRoute: Route | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadRoutes: () => void;
  setRoutes: (routes: Route[]) => void;
  selectRoute: (route: Route | null) => void;
  addRoute: (route: Route) => void;
  updateRoute: (name: string, updates: Partial<Route>) => void;
  deleteRoute: (name: string) => void;
  duplicateRoute: (name: string) => void;
  reorderRoutes: (startIndex: number, endIndex: number) => void;
  clearError: () => void;
}

export const useRouteStore = create<RouteStore>((set, get) => ({
  routes: [],
  selectedRoute: null,
  isLoading: false,
  error: null,

  loadRoutes: () => {
    try {
      set({ isLoading: true, error: null });
      const routes = storageService.loadRoutes();
      set({ routes, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  setRoutes: (routes) => {
    try {
      storageService.saveRoutes(routes);
      set({ routes, error: null });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  selectRoute: (route) => {
    set({ selectedRoute: route });
  },

  addRoute: (route) => {
    const routes = [...get().routes, route];
    get().setRoutes(routes);
    set({ selectedRoute: route });
  },

  updateRoute: (name, updates) => {
    const routes = get().routes.map((route) =>
      route.name === name ? { ...route, ...updates } : route
    );
    get().setRoutes(routes);

    // Update selected route if it's the one being updated
    const selectedRoute = get().selectedRoute;
    if (selectedRoute?.name === name) {
      set({ selectedRoute: { ...selectedRoute, ...updates } });
    }
  },

  deleteRoute: (name) => {
    const routes = get().routes.filter((route) => route.name !== name);
    get().setRoutes(routes);

    // Clear selection if deleted route was selected
    if (get().selectedRoute?.name === name) {
      set({ selectedRoute: null });
    }
  },

  duplicateRoute: (name) => {
    const route = get().routes.find((r) => r.name === name);
    if (!route) return;

    const newRoute: Route = {
      ...route,
      name: `${route.name}-copy`,
    };

    const routes = [...get().routes, newRoute];
    get().setRoutes(routes);
  },

  reorderRoutes: (startIndex, endIndex) => {
    const routes = Array.from(get().routes);
    const [removed] = routes.splice(startIndex, 1);
    routes.splice(endIndex, 0, removed);
    get().setRoutes(routes);
  },

  clearError: () => {
    set({ error: null });
  },
}));
