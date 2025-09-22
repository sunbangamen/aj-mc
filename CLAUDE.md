# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Firebase-based ultrasonic sensor monitoring system (관제모니터링 시스템) that displays real-time data from multiple sites. The system consists of:

- **Frontend**: Vite + React web application for monitoring dashboard
- **Backend**: Firebase Realtime Database for sensor data storage
- **Deployment**: Firebase Hosting for web application

## Project Structure

This project has completed Phase 1-9 of MVP development with comprehensive monitoring system. Current architecture:

```
src/
├── components/
│   ├── Layout.jsx           # Navigation with dropdown menu (✅ implemented)
│   ├── MeasurementTable.jsx # Sensor measurement history table (✅ implemented)
│   ├── SensorChart.jsx      # Recharts-based real-time chart (✅ implemented)
│   ├── SiteForm.jsx         # Site creation/editing form (✅ implemented)
│   ├── SystemStatsCards.jsx # Real-time system statistics cards (✅ implemented)
│   ├── RecentEventsPanel.jsx # Recent events monitoring panel (✅ implemented)
│   ├── SystemStatusPanel.jsx # System performance monitoring (✅ implemented)
│   ├── QuickActionsPanel.jsx # Quick action buttons (✅ implemented)
│   └── SensorSimulationPanel.jsx # Sensor data simulation controls (✅ implemented)
├── pages/
│   ├── Dashboard.jsx        # Main dashboard showing all sites (✅ implemented)
│   ├── SiteMonitor.jsx      # Individual site monitoring with charts (✅ implemented)
│   ├── AdminDashboard.jsx   # Site management dashboard (✅ implemented)
│   ├── TestPanel.jsx        # Firebase connection testing (✅ implemented)
│   └── SimulationDashboard.jsx # Sensor simulation control interface (✅ implemented)
├── services/
│   └── firebase.js          # Firebase configuration and services (✅ implemented)
├── hooks/
│   ├── useSensorData.js     # Custom hooks for real-time sensor data (✅ implemented)
│   └── useSiteManagement.js # Custom hooks for site CRUD operations (✅ implemented)
├── contexts/
│   └── SimulationContext.jsx # Global simulation state management (✅ implemented)
├── utils/
│   └── sensorSimulator.js   # Sensor data simulation utilities (✅ implemented)
├── types/
│   ├── sensor.js            # Sensor data types and utilities (✅ implemented)
│   └── site.js              # Site data types and utilities (✅ implemented)
└── scripts/
    └── check-env.mjs        # Environment validation (✅ implemented)
```

## Firebase Data Structure

The system uses dual data structure for sites and sensors:
```
/sites/                   # Site management data
├── site_1234567890_abc123/
│   ├── name: "현장명"
│   ├── location: "현장 위치"
│   ├── description: "현장 설명"
│   ├── sensorCount: 2
│   ├── sensorTypes: ["ultrasonic", "temperature"]
│   ├── status: "active|inactive|maintenance"
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

/sensors/                 # Real-time sensor data
├── site_1234567890_abc123/
│   ├── ultrasonic/
│   │   ├── distance: 120
│   │   ├── status: "normal|warning|alert|offline"
│   │   ├── timestamp: timestamp
│   │   └── history/      # Historical measurements (last 20)
│   └── temperature/
└── test/ultrasonic/      # Test data
```

## Key Features (✅ Implemented)

### Core Monitoring System
- **Real-time monitoring**: Firebase onValue listeners for live updates (✅ Working)
- **Multi-site dashboard**: Overview of all sensor sites with real-time status (✅ Working)
- **Individual site monitoring**: Detailed monitoring with Recharts visualization (✅ Working)
- **Historical data**: Last 20 measurements with time-series charts (✅ Working)
- **Mobile responsive**: Optimized for both desktop and mobile devices (✅ Working)
- **Status indicators**: Color-coded status (normal/warning/alert/offline) (✅ Working)
- **Error handling**: Graceful handling of connection failures and missing data (✅ Working)

### Site Management System
- **Admin dashboard**: Complete site management interface at `/admin` (✅ Working)
- **Site CRUD operations**: Create, read, update, delete sites with validation (✅ Working)
- **Dynamic site creation**: Auto-generates sensor data when creating sites (✅ Working)
- **Site statistics**: Real-time stats (total sites, active sites, maintenance, sensors) (✅ Working)
- **Form validation**: Comprehensive client-side validation with error handling (✅ Working)
- **Sensor configuration**: Multi-sensor type selection (ultrasonic, temperature, humidity, pressure) (✅ Working)

### Advanced Features (Phase 8-9)
- **Sensor Data Simulation**: Real-time sensor data generation without physical hardware
  - Multiple simulation modes: Random, Scenario-based, Gradual change
  - Global state management with React Context API for persistent simulation
  - Real-time Firebase data updates with performance monitoring
  - Processing time measurement and optimization
- **Professional Dashboard Interface**: Complete UI/UX overhaul
  - Full-screen responsive layout (removed width constraints)
  - Real-time system statistics cards with live counts and status indicators
  - Recent events panel with chronological monitoring
  - System performance monitoring with actual metrics (not fake CPU/memory)
  - Quick actions panel for rapid system control
- **Enhanced Navigation**: Scalable navigation system
  - Brand updated to "(사)안전재해환경대책본부"
  - Site links converted to dropdown menu for better scalability
  - Dynamic site counter and "add new site" functionality

### Enterprise Features (Phase 14A-F) - 2025-09-20
- **Multi-sensor Architecture**: Support for multiple sensor types per site
  - Ultrasonic, temperature, humidity, pressure sensors
  - Individual sensor tracking with unique keys (ultrasonic_01, temperature_01, etc.)
  - Backward compatibility with legacy single-sensor structure
- **Hardware Metadata System**: Complete sensor lifecycle management
  - Battery level, WiFi signal strength, firmware version tracking
  - Installation date, maintenance schedule, calibration records
  - Accuracy, reliability, error count monitoring
- **Advanced Alert System**: 6-type alert system with real-time monitoring
  - Threshold alerts (warning/alert ranges)
  - Offline detection, battery warnings, signal strength alerts
  - Maintenance reminders, error count tracking
  - Site-specific and global threshold management
- **Site-specific Threshold System**: Customizable alert thresholds
  - Global default thresholds for all sites
  - Site-specific override capability
  - Sensor-type specific threshold configuration
  - Admin panel with URL routing for easy management

### Technical Features
- **Environment validation**: Automated Firebase configuration checking (✅ Working)
- **Real-time navigation**: Dynamic site dropdown menu with live updates (✅ Working)
- **Data consistency**: Site creation/deletion includes corresponding sensor data (✅ Working)
- **Global simulation management**: Persistent simulation state across page navigation (✅ Working)
- **Performance monitoring**: Real application metrics instead of simulated system stats (✅ Working)

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
- **Framework**: React 19
- **Database**: Firebase Realtime Database
- **Hosting**: Firebase Hosting (✅ **운영 중**)

### 🌐 운영 환경 접속 정보
- **운영 URL**: https://ultrasonic-monitoring-mvp.web.app
- **Firebase Console**: https://console.firebase.google.com/project/ultrasonic-monitoring-mvp
- **배포일**: 2025-09-22
- **상태**: ✅ 정상 운영 중

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
npm run build           # Build for production (성능 최적화 적용)

# Deployment (✅ 구축 완료)
npm run deploy          # 전체 배포 (빌드 + 호스팅 + 규칙)
npm run deploy:hosting  # 호스팅만 배포
npm run deploy:rules    # 보안 규칙만 배포
firebase deploy         # Firebase CLI 직접 배포

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
- Chart integration using Recharts for data visualization (✅ Completed in Phase 5)

### Routing (✅ Implemented)
- React Router for SPA navigation:
  - `/` - Main dashboard showing all sites overview (✅ Working)
  - `/site/:siteId` - Individual site monitoring with charts and history (✅ Working)
  - `/admin` - Site management dashboard with CRUD operations (✅ Working)
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

### ✅ Completed (Phase 1-9)
- **Phase 1-2**: Environment Setup + Firebase integration complete
- **Phase 3**: Real-time monitoring with live sensor data updates
- **Phase 4**: Multi-site dashboard with simultaneous monitoring
- **Phase 5**: Data visualization with Recharts + measurement history (Issue #3)
- **Phase 7A**: Admin dashboard with site management CRUD operations
- **Phase 7B**: Site creation/editing forms with comprehensive validation
- **Phase 8**: Sensor data simulation system with global state management
- **Phase 9**: Dashboard UI/UX improvements with professional monitoring interface

### ✅ Completed (Phase 14A-F) - 2025-09-20 업데이트
- **Phase 14A**: Multi-sensor support architecture (완료)
- **Phase 14B**: Multi-sensor simulation system (완료)
- **Phase 14C**: Multi-sensor UI/UX complete support (완료)
- **Phase 14D**: Hardware metadata extension (완료)
- **Phase 14E**: Alert and threshold system (완료)
- **Phase 14F**: Site-specific threshold system + UI/UX improvements (완료)

### ✅ **Phase 3 완료**: Firebase Hosting 배포 및 운영 환경 구축 (2025-09-22)
- **Firebase Hosting 배포**: 운영 환경 정상 배포 완료
- **환경 분리 시스템**: production/development 경로 분리 구현
- **성능 최적화**: 번들 분리 및 코드 스플리팅 적용
- **보안 설정**: Firebase Security Rules 적용
- **CI/CD 준비**: GitHub Actions 워크플로우 구성

### 🚧 Next Phases (Recommended Priority)
- **Phase 4**: GitHub Actions CI/CD 자동화 완성 (Secrets 설정)
- **Phase 5**: Advanced data visualization with custom time ranges and filtering
- **Phase 6**: Smart alert system with email/SMS notifications
- **Phase 7**: Data export functionality (CSV/Excel) and reporting system
- **Phase 8**: User authentication and role-based access control

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

### 로컬 개발 환경
1. **Start Development Server**: `npm run dev`
2. **Access Interface**: http://localhost:5173/ (PC) or http://[network-ip]:5173/ (Mobile)
3. **Test Firebase**: Use `/test` page to verify connection
4. **Add Test Data**: Firebase Console → Realtime Database → Add sensor data
5. **Monitor Real-time**: Change values in Firebase Console and watch live updates
6. **Site Management**: Access `/admin` to create/edit/delete sites with automatic sensor data generation

### 운영 환경 접속 🌐
1. **운영 사이트**: https://ultrasonic-monitoring-mvp.web.app
2. **모든 기능 사용 가능**: 대시보드, 사이트 관리, 알림, 시뮬레이션
3. **실시간 센서 데이터**: Firebase Realtime Database 연동
4. **모바일 최적화**: 스마트폰에서도 완전한 기능 사용 가능

## Recent Critical Fixes (2025-09-20)

### Sensor Key Preservation Issue
- **Problem**: Charts and measurement history not displaying for newly created sites
- **Root Cause**: Key mismatch between Firebase storage ('ultrasonic_01') and component access ('ultrasonic_1')
- **Solution**: Modified `extractSensorsFromSiteData` in `src/types/sensor.js` to preserve original Firebase keys while maintaining display normalization
- **Files Changed**: `src/types/sensor.js`, `src/pages/SiteMonitor.jsx`

### JSX Syntax Error Resolution
- **Problem**: Nested ternary operator syntax error in SiteMonitor.jsx:396
- **Solution**: Properly wrapped `.map()` function in parentheses for correct JSX parsing
- **Status**: ✅ Fixed - Server running without errors

### System Completion Status
- **Current State**: 99.5% complete enterprise monitoring system
- **All Phase 14A-F Features**: Fully implemented and tested
- **Next Recommended**: Phase 10 (Advanced Data Visualization) for enhanced user analytics

## Location Display Enhancement Proposal
- **Issue**: Sensor location information scattered across multiple components
- **Priority Improvement Areas**:
  1. Dashboard SiteCard - Add sensor location to main view
  2. AlertBanner/AlertManager - Include location in alert messages
  3. Visual sensor map - Future enhancement for spatial awareness