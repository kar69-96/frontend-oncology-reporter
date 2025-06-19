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
- **References Page Enhancement**: Renamed title to "References" and added ~50 NAACCR codes alongside ICD-O-3 codes with filtering by code type
- **Document Viewer Scrolling Fix**: Fixed overflow issues to enable proper scrolling in document content area
- **Data Uncertainty Indicators**: Implemented visual confidence indicators with yellow borders for medium confidence fields and red borders for low confidence fields
- **NAACCR Code Integration**: Added comprehensive NAACCR codes organized into Demographics, Tumor, Staging, Treatment, Follow-up, and Administrative categories
- **Advanced Filtering**: Enhanced References page with dual code type filtering (ICD-O-3/NAACCR) and expanded category options
- **Form Confidence Styling**: Added dynamic border styling based on data extraction confidence levels for OCR-derived fields
- **Confidence Level Optimization**: Reduced medium confidence field tolerance - now only clinicalN shows yellow borders, while most fields display normal styling with only truly uncertain fields (histologicType, gradeDifferentiation, clinicalM, pathologicN, radiationTherapy) showing red borders
- **Draft Saving Functionality**: Added "Save Draft" button alongside "Complete & Save" for patient forms, allowing users to save work in progress without marking forms as completed
- **Logo Removal**: Removed microscope logo from navigation, simplified to clean "Oncology Registry" text branding

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