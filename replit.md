# Oncology Tumor Registry Application

## Overview
An ultra-clean, simple oncology tumor registry with intuitive navigation, prominent document upload, and minimal UI design. Built with React, focusing on clinical workflow optimization.

## Project Architecture
- **Frontend**: React with TypeScript, Wouter routing, TanStack Query
- **Backend**: Express.js with in-memory storage
- **UI Framework**: Shadcn/UI with Tailwind CSS
- **Storage**: In-memory storage (MemStorage) for MVP

## User Preferences
- Ultra-clean, simple, and easy-to-use UI
- Minimal design with intuitive navigation
- Clean patient view without codes initially
- Codes appear only when "coded view" is selected
- Upload button prominently placed in document pane
- Sidebar should hide when focusing on individual patients

## Recent Changes
- **Comprehensive Cancer Registry Fields**: Implemented complete structured list of cancer registry fields grouped into 6 logical sections with proper validation and dropdown options
- **Advanced Patient Form**: Created comprehensive tumor registry form with 44+ fields including demographics, tumor identification, staging, treatment, follow-up, and administrative data
- **Document Viewer Enhancement**: Added collapsible document selector with inline viewing and auto-hide functionality for focused document reading
- **Sample Data Generation**: Enhanced storage layer with realistic sample data for all comprehensive cancer registry fields
- **Form Validation**: Added proper Zod schema validation with required/optional field indicators and coding support
- **UI/UX Improvements**: Organized form fields into intuitive sections with proper spacing, badges for field requirements, and code visibility toggle

## Key Features Implementation Plan

### 1. Dashboard (Home Screen)
- Left pane: Patient overview with status indicators
- Main pane: Analytics cards and visual charts
- Top navigation: Dashboard, Patients, References tabs

### 2. Patients Page
- Patient management with bulk operations
- Filtering and search capabilities
- Submit to registry and XML download

### 3. Individual Patient Page
- Split-pane: Document viewer (left) + Registry form (right)
- Upload button in document pane top-right
- Toggle for "Show Codes" functionality
- Expandable panes for focused work

### 4. References Page
- Editable ICD-O-3 coding reference table
- Search and filter capabilities
- Inline editing with validation

## Development Status
- ✅ Project setup and planning
- ✅ Dashboard with patient overview and analytics
- ✅ Patient management page with filtering
- ✅ 20 realistic sample patients with medical data
- ✅ Document viewer with file types
- ✅ ICD-O-3 reference management
- → Currently debugging: Patient form rendering issue