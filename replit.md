# Overview

This is a React-based fruit collection game with user authentication and inventory management. Players can click to spawn random fruits with different rarity levels (common to legendary) and build their collection over time. The application features a modern UI built with shadcn/ui components and includes real-time game mechanics with cooldown timers.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for the main UI framework
- **Wouter** for client-side routing instead of React Router
- **shadcn/ui** component library built on Radix UI primitives for consistent design system
- **Tailwind CSS** for styling with custom color variables and dark theme support
- **TanStack Query** for server state management and API caching
- **React Hook Form** with Zod validation for form handling

## Backend Architecture
- **Express.js** server with TypeScript
- **Passport.js** with LocalStrategy for session-based authentication
- **Express-session** with PostgreSQL session store for persistent sessions
- **RESTful API** structure with `/api` prefix for all endpoints
- **Modular route organization** with separate auth and game logic

## Database & ORM
- **PostgreSQL** as the primary database
- **Drizzle ORM** for type-safe database operations and migrations
- **Neon Database** serverless PostgreSQL for cloud hosting
- **Schema-first approach** with shared types between client and server

## Game Logic & State Management
- **Probability-based fruit spawning** system with weighted rarities
- **Real-time inventory tracking** with optimistic updates
- **Cooldown mechanics** to prevent spam clicking
- **Session-based user progress** persistence

## Development & Build Tools
- **Vite** for fast development and optimized production builds
- **ESBuild** for server-side bundling
- **TypeScript** throughout the entire stack for type safety
- **Path aliases** for clean imports (`@/`, `@shared/`)

## Authentication & Security
- **Password hashing** using Node.js crypto with scrypt
- **Session management** with secure cookies
- **CSRF protection** through same-origin policy
- **Input validation** using Zod schemas on both client and server

# External Dependencies

## Database Services
- **Neon Database** - Serverless PostgreSQL hosting with connection pooling
- **PostgreSQL** - Primary database engine via `@neondatabase/serverless`

## UI Framework Dependencies  
- **Radix UI** - Headless component primitives for accessibility
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library for consistent iconography
- **Class Variance Authority** - Component variant management

## Development Tools
- **Replit Integration** - Development environment with cartographer and runtime error overlay
- **PostCSS** with Autoprefixer for CSS processing
- **Google Fonts** - Custom font loading (Nunito Sans, Font Awesome)

## Authentication & Session Management
- **connect-pg-simple** - PostgreSQL session store adapter
- **Express session** - Server-side session management

## Build & Runtime
- **Node.js** ESM modules with top-level await support
- **TSX** for TypeScript execution in development
- **Vite plugins** for React, error handling, and development tools