/**
 * Models exports for easy importing
 * This file serves as the central export point for all database models
 */

// Core Business Models
export { default as User } from './User.js'
export { default as Ticket } from './Ticket.js'
export { default as Comment } from './Comment.js'
export { default as Attachment } from './Attachment.js'

// Configuration Models
export { default as Category } from './Category.js'
export { default as TicketType } from './TicketType.js'
export { default as CustomStatus } from './CustomStatus.js'
export { default as Tag } from './Tag.js'

// Solution & Feedback Models
export { default as Solution } from './Solution.js'
export { default as Feedback } from './Feedback.js'
