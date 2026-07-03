/**
 * Hooks index - Central export point for all custom hooks
 */

// Authentication hook
export { useAuth } from './useAuth'

// API hooks
export { useApi, usePaginatedApi } from './useApi'

// Storage hooks
export { useLocalStorage, useObjectStorage, useArrayStorage } from './useLocalStorage'

// Inactivity logout hook
export { useInactivityLogout } from './useInactivityLogout'

// Hook categories for organized imports
export * as AuthHooks from './useAuth'
export * as ApiHooks from './useApi'
export * as StorageHooks from './useLocalStorage'