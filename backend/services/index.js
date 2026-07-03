/**
 * Services exports for easy importing
 * This file serves as the central export point for all business logic services
 */

// Core Services
export * from './authService.js'
export * from './userService.js'
export * from './ticketService.js'
export * from './solutionService.js'
export * from './commentService.js'

// Import service instances for direct use
import { authService } from './authService.js'
import { userService } from './userService.js'
import { ticketService } from './ticketService.js'
import { solutionService } from './solutionService.js'
import { commentService } from './commentService.js'

// Export service instances grouped by functionality
export const services = {
  auth: authService,
  user: userService,
  ticket: ticketService,
  solution: solutionService,
  comment: commentService
}
