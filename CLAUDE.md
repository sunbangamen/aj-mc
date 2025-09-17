# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Firebase-based ultrasonic sensor monitoring system (관제모니터링 시스템) that displays real-time data from multiple sites. The system consists of:

- **Frontend**: Vite + React web application for monitoring dashboard
- **Backend**: Firebase Realtime Database for sensor data storage
- **Deployment**: Firebase Hosting for web application

## Project Structure

This project is currently in MVP planning phase with the following planned architecture:

```
src/
├── components/
│   ├── Dashboard.js       # Main dashboard showing all sites
│   ├── SiteMonitor.js     # Individual site monitoring
│   ├── SensorChart.js     # Real-time data visualization
│   └── common/            # Shared UI components
├── services/
│   └── firebase.js        # Firebase configuration and services
├── hooks/
│   └── useSensorData.js   # Custom hooks for real-time data
└── styles/
```

## Firebase Data Structure

The system monitors sensor data with this structure:
```
/sensors/
├── site1/ultrasonic/     # Site 1 ultrasonic data
├── site2/ultrasonic/     # Site 2 ultrasonic data
└── test/ultrasonic/      # Test data
```

## Key Features

- **Real-time monitoring**: Firebase onValue listeners for live updates
- **Multi-site dashboard**: Overview of all sensor sites
- **Individual site details**: Detailed monitoring per site with charts
- **Mobile responsive**: Works on both desktop and mobile devices
- **Status indicators**: Color-coded status (normal/warning/alert/offline)

## Custom Commands

This repository includes Korean-language Claude command templates:

### Issue Management
- `.claude/commands/create-issue.md` - Template for creating detailed GitHub issues
- `.claude/commands/resolve-issue.md` - Template for analyzing and planning issue resolution
- `.claude/commands/feature-breakdown.md` - Template for breaking down complex features into tasks

### Development Workflow
- `create-worktree.sh` - Creates git worktrees for feature development
  ```bash
  ./create-worktree.sh <branch-name>
  ```

## Development Environment

- **Local development**: WSL Ubuntu environment
- **Package manager**: npm
- **Build tool**: Vite
- **Framework**: React 18
- **Database**: Firebase Realtime Database
- **Hosting**: Firebase Hosting

## Common Development Commands

Based on the planned MVP structure:

```bash
# Development
npm run dev              # Start development server

# Building
npm run build           # Build for production

# Deployment
firebase deploy         # Deploy to Firebase Hosting

# Installation
npm install             # Install dependencies
```

## Architecture Patterns

### Real-time Data Handling
- Use Firebase `onValue` listeners for real-time updates
- Custom hooks (`useSensorData`) for data management
- State management for multiple site monitoring

### Component Structure
- Modular component design with common UI elements
- Responsive layout supporting both desktop monitoring and mobile viewing
- Chart integration using Recharts for data visualization

### Routing
- React Router for SPA navigation:
  - `/` - Main dashboard
  - `/site/:siteId` - Individual site monitoring
  - `/test` - Test panel for Firebase data verification

## Environment Configuration

- `.env` file contains Firebase configuration
- Separate development and production Firebase projects
- Environment variables for API keys and project settings

## Korean Language Support

This project includes Korean language documentation and templates. All user-facing text and command templates are in Korean, designed for Korean development teams.

## Worktree Workflow

The project uses git worktrees for feature development:
- Worktrees are created in `../worktree/` directory
- Each feature branch gets its own worktree
- Automatic Claude Code initialization in new worktrees