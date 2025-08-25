# Legacy Cricket Academy Management System

## Overview

Legacy Cricket Academy is a comprehensive web application designed to manage cricket academy operations. The system provides distinct interfaces for parents, coaches, and administrators to handle student registrations, training schedules, performance tracking, payments, and administrative approvals. The application follows a modern full-stack architecture with React for the frontend, Express.js for the backend, and PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and enhanced developer experience
- **Styling**: Tailwind CSS for utility-first styling with shadcn/ui components for consistent UI elements
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: React Router for client-side navigation with dynamic route handling
- **State Management**: React hooks and context for local state management
- **Form Handling**: React Hook Form with Zod for validation and type-safe form management

### Backend Architecture
- **Framework**: Express.js with TypeScript for server-side logic
- **Database ORM**: Drizzle ORM for type-safe database interactions and migrations
- **Authentication Strategy**: Multi-provider approach supporting both Firebase Authentication and direct database authentication
- **API Response Structure**: Standardized response format across all endpoints for consistent error handling and data transfer
- **File Organization**: Modular route handlers with separate concerns for authentication, user management, and business logic

### Database Design
- **Database**: PostgreSQL for reliable relational data storage
- **Schema Management**: Drizzle Kit for database migrations and schema evolution
- **User Roles**: Role-based access control supporting parent, coach, admin, and superadmin roles
- **Data Relationships**: Structured relationships between users, students, sessions, and payments

### Authentication and Authorization
- **Multi-Provider Auth**: Firebase Authentication for OAuth providers (Google, etc.) with fallback to direct database authentication
- **Password Security**: bcrypt for password hashing with salt rounds
- **Session Management**: JWT tokens for secure session handling
- **Role-Based Access**: Granular permissions based on user roles with middleware enforcement

### API Architecture
- **Response Format**: Consistent API response structure with success/error states, messages, and typed error codes
- **Error Handling**: Comprehensive error categorization including database errors, validation failures, and authentication issues
- **Input Validation**: Server-side validation with detailed error messages and client-side feedback
- **Username Management**: Real-time username availability checking with suggestion system for alternatives

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL via Neon serverless database for scalable data storage
- **Email Service**: SendGrid for transactional emails including registration confirmations and notifications
- **Authentication**: Firebase Authentication for OAuth provider integration and user management

### Payment Processing
- **Stripe**: Primary payment processor for handling academy fees and subscription payments
- **PayPal**: Secondary payment option via PayPal Server SDK for additional payment flexibility

### Development and Deployment
- **Build System**: Vite for frontend bundling and development server
- **TypeScript**: Full-stack type safety with shared type definitions
- **CSS Framework**: Tailwind CSS for responsive design and component styling
- **UI Components**: Radix UI primitives via shadcn/ui for accessible and customizable components

### Communication and Notifications
- **Email Templates**: SendGrid for verification emails, approval notifications, and system communications
- **Real-time Features**: Planned integration for live updates on schedules and announcements

### Mobile Compatibility
- **Responsive Design**: Mobile-first approach with Tailwind CSS responsive utilities
- **Touch Optimization**: Touch-friendly interface elements with appropriate sizing and spacing
- **Progressive Enhancement**: Graceful degradation for various device capabilities and network conditions