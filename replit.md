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
- Initial project setup and roadmap creation
- Data schema design for patients, documents, and registry fields

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
- → Currently implementing: Data schema and project structure