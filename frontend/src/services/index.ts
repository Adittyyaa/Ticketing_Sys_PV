/**
 * Services index - Central export point for all services
 * API services and business logic abstractions
 */

// Core API client
export * from './api'
export { default as apiClient } from './api'

// Authentication service
export * from './authService'
export { default as authService } from './authService'

// Ticket service
export * from './ticketService'
export { default as ticketService } from './ticketService'

// Admin service
export * from './adminService'
export { default as adminService } from './adminService'

// Solution service
export * from './solutionService'
export { default as solutionService } from './solutionService'

// Feedback service
export * from './feedbackService'
export { default as feedbackService } from './feedbackService'

// Services collection for organized access
export const services = {
  auth: () => import('./authService').then(m => m.authService),
  ticket: () => import('./ticketService').then(m => m.ticketService),
  admin: () => import('./adminService').then(m => m.adminService),
  solution: () => import('./solutionService').then(m => m.solutionService),
  feedback: () => import('./feedbackService').then(m => m.feedbackService),
}

// Service health check
export function checkServicesHealth() {
  return {
    api: typeof window !== 'undefined',
    auth: typeof localStorage !== 'undefined',
    timestamp: new Date().toISOString()
  }
}
