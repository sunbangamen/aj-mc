# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Firebase-based ultrasonic sensor monitoring system (관제모니터링 시스템) that displays real-time data from multiple sites. The system consists of:

- **Frontend**: Vite + React web application for monitoring dashboard
- **Backend**: Firebase Realtime Database for sensor data storage
- **Deployment**: Firebase Hosting for web application

## Project Structure

This project has completed Phase 1-2 of MVP development with real-time Firebase integration. Current architecture:

```
src/
├── components/
│   └── Layout.jsx         # Navigation layout (✅ implemented)
├── pages/
│   ├── Dashboard.jsx      # Main dashboard showing all sites (✅ implemented)
│   ├── SiteMonitor.jsx    # Individual site monitoring (✅ implemented)
│   └── TestPanel.jsx      # Firebase connection testing (✅ implemented)
├── services/
│   └── firebase.js        # Firebase configuration and services (✅ implemented)
├── hooks/
│   └── useSensorData.js   # Custom hooks for real-time data (✅ implemented)
├── types/
│   └── sensor.js          # Data types and utilities (✅ implemented)
└── scripts/
    └── check-env.mjs      # Environment validation (✅ implemented)
```

## Firebase Data Structure

The system monitors sensor data with this structure:
```
/sensors/
├── site1/ultrasonic/     # Site 1 ultrasonic data
├── site2/ultrasonic/     # Site 2 ultrasonic data
└── test/ultrasonic/      # Test data
```

## Key Features (✅ Implemented)

- **Real-time monitoring**: Firebase onValue listeners for live updates (✅ Working)
- **Multi-site dashboard**: Overview of all sensor sites (✅ Working)
- **Individual site details**: Detailed monitoring per site (✅ Working, charts pending)
- **Mobile responsive**: Works on both desktop and mobile devices (✅ Working)
- **Status indicators**: Color-coded status (normal/warning/alert/offline) (✅ Working)
- **Error handling**: Graceful handling of connection failures and missing data (✅ Working)
- **Environment validation**: Automated Firebase configuration checking (✅ Working)

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
npm run dev              # Start development server (Port: 5173)
npm run check-env        # Validate Firebase environment variables

# Code Quality
npm run lint             # ESLint code checking
npm run format           # Prettier code formatting

# Building
npm run build           # Build for production

# Deployment
firebase deploy         # Deploy to Firebase Hosting (not configured yet)

# Installation
npm install             # Install dependencies
```

## Architecture Patterns

### Real-time Data Handling
- Use Firebase `onValue` listeners for real-time updates
- Custom hooks (`useSensorData`) for data management
- State management for multiple site monitoring

### Component Structure
- Modular component design with common UI elements (✅ Implemented)
- Responsive layout supporting both desktop monitoring and mobile viewing (✅ Implemented)
- Chart integration using Recharts for data visualization (🚧 Planned for Phase 3)

### Routing (✅ Implemented)
- React Router for SPA navigation:
  - `/` - Main dashboard (✅ Working)
  - `/site/:siteId` - Individual site monitoring (✅ Working)
  - `/test` - Test panel for Firebase data verification (✅ Working)

## Environment Configuration (✅ Implemented)

- `.env` file contains Firebase configuration (✅ Working)
- Automated environment validation with `npm run check-env` (✅ Working)
- Environment variables for API keys and project settings (✅ Working)
- Firebase project: `ultrasonic-monitoring-mvp` (✅ Active)
- Development server accessible on both localhost and network (✅ Working)

## Korean Language Support

This project includes Korean language documentation and templates. All user-facing text and command templates are in Korean, designed for Korean development teams.

## Current Development Status

### ✅ Completed (Phase 1-2)
- **Environment Setup**: Vite + React + Firebase integration complete
- **Real-time Monitoring**: Live sensor data with sub-second updates
- **Multi-site Dashboard**: Simultaneous monitoring of multiple sensor locations
- **Responsive UI**: Mobile and desktop compatible interface
- **Error Handling**: Robust connection failure and data validation

### 🚧 Next Phase (Phase 3)
- **Data Visualization**: Recharts integration for time-series charts
- **Historical Data**: Measurement logs and trend analysis
- **Enhanced Monitoring**: Offline detection and advanced alerting

### 📁 Important Files
- `memo.md` - Detailed development progress and next steps
- `docs/firebase-data-structure.md` - Database schema documentation
- `.env.example` - Firebase configuration template

## Worktree Workflow

The project uses git worktrees for feature development:
- Worktrees are created in `../worktree/` directory
- Each feature branch gets its own worktree
- Automatic Claude Code initialization in new worktrees

## Quick Start for Development

1. **Start Development Server**: `npm run dev`
2. **Access Interface**: http://localhost:5173/ (PC) or http://[network-ip]:5173/ (Mobile)
3. **Test Firebase**: Use `/test` page to verify connection
4. **Add Test Data**: Firebase Console → Realtime Database → Add sensor data
5. **Monitor Real-time**: Change values in Firebase Console and watch live updates