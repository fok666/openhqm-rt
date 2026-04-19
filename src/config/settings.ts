export const settings = {
  app: {
    name: 'OpenHQM Router Manager',
    version: '2.0.0',
    repository: 'https://github.com/fok666/openhqm-rt',
  },

  storage: {
    localStorageKey: 'openhqm_routes',
    autoSaveInterval: 30000, // 30 seconds
    maxRoutes: 100,
  },

  jq: {
    maxExecutionTime: 5000, // milliseconds
    defaultExamples: [
      { name: 'Extract fields', expression: '{ id: .id, name: .name }' },
      {
        name: 'Filter array',
        expression: '[.items[] | select(.active == true)]',
      },
      {
        name: 'Flatten nested',
        expression: '.orders[].items[] | {orderId: .orderId, sku: .sku}',
      },
      {
        name: 'Conditional',
        expression: 'if .priority == "high" then .sla = 1 else .sla = 24 end',
      },
      {
        name: 'Error handling',
        expression: '{ id: .id, name: .name // "Unknown", email: .contact.email // "N/A" }',
      },
    ],
  },

  validation: {
    maxConditions: 20,
    maxRouteNameLength: 100,
    minPriority: 0,
    maxPriority: 1000,
  },

  export: {
    defaultNamespace: 'openhqm',
    defaultConfigMapName: 'openhqm-routes',
    includeTimestamp: true,
  },
};
