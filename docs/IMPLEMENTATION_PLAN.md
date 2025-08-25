# Aya Healthcare Analytics - Implementation Plan

## Project Overview
Building a comprehensive web-based analytics tool for healthcare onboarding data with BigQuery integration, focusing on user engagement metrics, user journey tracking, and screen flow analysis.

## Phase Structure

### ✅ Phase 1A: BigQuery Integration Foundation (COMPLETED)
**Duration: Completed** 
**Status: ✅ Complete**

- [x] Project structure setup (.NET 8 Web API + React 18)
- [x] BigQuery authentication and connection
- [x] Dynamic table discovery system
- [x] Service architecture with dependency injection
- [x] Comprehensive error handling and logging
- [x] WSL/Windows compatibility

**Key Deliverables:**
- 95 tables discovered automatically
- Robust table metadata collection
- Service-based architecture ready for expansion

---

### ✅ Phase 1B: User-Driven Analytics (COMPLETED)
**Duration: Completed**
**Status: ✅ Complete**

- [x] AnalyticsController with user-driven date selection
- [x] Frontend date range picker with validation
- [x] Analytics query panel with multiple query types
- [x] Real-time query execution and results display
- [x] System architecture shift from automatic to user-controlled

**Key Deliverables:**
- Complete user-driven analytics system
- DateRangePicker and AnalyticsQueryPanel components
- Support for sample, engagement, and user journey queries
- Date range validation against available BigQuery data

---

### 🔄 Phase 1C: API Client Generation (IN PROGRESS)
**Duration: 1-2 days**
**Status: 🔄 In Progress**

#### Backend API Documentation & Generation
- [ ] **Install NSwag packages** in .NET backend
  - NSwag.AspNetCore for OpenAPI generation
  - NSwag.MSBuild for build-time client generation
- [ ] **Configure Swagger/OpenAPI** in Program.cs
  - Enable OpenAPI documentation
  - Configure API versioning
  - Add comprehensive API documentation attributes
- [ ] **Enhance Controllers with OpenAPI attributes**
  - Add [SwaggerOperation] attributes
  - Define request/response models clearly
  - Add example values and descriptions

#### Frontend Client Generation
- [ ] **Configure NSwag client generation**
  - Create nswag.json configuration file
  - Set up TypeScript client generation
  - Configure output paths and namespaces
- [ ] **Update build process**
  - Add pre-build script to generate client
  - Ensure client regeneration on API changes
  - Handle build dependencies correctly
- [ ] **Replace manual API service**
  - Remove hand-written apiService.ts
  - Update all frontend components to use generated client
  - Update import statements and method calls

#### Integration & Testing
- [ ] **Test generated client** with existing frontend components
- [ ] **Verify type safety** and IntelliSense support
- [ ] **Update documentation** with new development workflow

**Key Benefits:**
- Automatic TypeScript client generation
- Strong typing and IntelliSense support
- Guaranteed API/client synchronization
- Reduced manual maintenance overhead

---

### 📋 Phase 2: Core Analytics Implementation
**Duration: 3-4 weeks**
**Status: 🔲 Planned**

#### Engagement Metrics Engine
- [ ] **Advanced engagement calculations**
  - User session depth analysis
  - Screen completion rates
  - Time-based engagement scoring
  - Comparative engagement metrics
- [ ] **Engagement visualization components**
  - Chart.js integration for engagement trends
  - Interactive engagement heatmaps
  - Funnel analysis visualizations
- [ ] **Export functionality**
  - PDF report generation
  - CSV data export
  - PNG chart export

#### User Journey Tracking
- [ ] **Individual journey analysis**
  - Complete user path reconstruction
  - Journey completion tracking
  - Drop-off point identification
  - Journey performance metrics
- [ ] **Journey visualization**
  - Interactive journey flow diagrams
  - Journey comparison tools
  - Cohort journey analysis
- [ ] **Journey search and filtering**
  - User search by email/ID
  - Journey filtering by criteria
  - Advanced journey querying

#### Screen Flow Analysis
- [ ] **Auto-detected screen flow mapping**
  - Automatic flow detection from event data
  - Screen transition analysis
  - Common path identification
  - Flow bottleneck detection
- [ ] **Flow visualization dashboard**
  - Interactive flow diagrams
  - Screen-level performance metrics
  - A/B testing flow comparison
- [ ] **Flow optimization recommendations**
  - Automated insight generation
  - Performance improvement suggestions
  - Data-driven flow recommendations

---

### 📋 Phase 3: Advanced Features & Polish
**Duration: 2-3 weeks**
**Status: 🔲 Planned**

#### Performance & Scalability
- [ ] **Advanced caching strategies**
  - Redis integration for query caching
  - Intelligent cache invalidation
  - Performance monitoring
- [ ] **Query optimization**
  - BigQuery query optimization
  - Parallel query execution
  - Result pagination and streaming
- [ ] **Real-time updates**
  - WebSocket integration for live data
  - Real-time dashboard updates
  - Live notification system

#### User Experience Enhancement
- [ ] **Advanced UI/UX**
  - Professional dashboard themes
  - Mobile-responsive design
  - Accessibility compliance
  - Dark/light mode support
- [ ] **Interactive features**
  - Drill-down capabilities
  - Cross-filtering between visualizations
  - Bookmarkable dashboard states
  - Custom dashboard layouts

#### Enterprise Features
- [ ] **User management**
  - Role-based access control
  - User authentication integration
  - Audit logging
- [ ] **Reporting & Alerts**
  - Scheduled report generation
  - Email alert system
  - Custom report templates
  - KPI monitoring and alerts

---

## Technical Architecture Evolution

### Current Architecture (Post-Phase 1B)
```
Frontend (React 18 + TypeScript)
├── DateRangePicker Component
├── AnalyticsQueryPanel Component  
├── Manual API Service Layer
└── Material-UI Components

Backend (.NET 8 Web API)
├── AnalyticsController (user-driven)
├── BigQueryTablesController
├── TestBigQueryController
├── BigQueryTableService (dynamic discovery)
├── BigQueryClientService (graceful handling)
└── Hosted Service (initialization)

Data Layer
└── BigQuery (95 tables, 2025-06-26 to 2025-08-24)
```

### Target Architecture (Post-Phase 1C)
```
Frontend (React 18 + TypeScript)
├── Components (using generated client)
├── Generated TypeScript API Client 
├── Type-safe API interfaces
└── Material-UI + Chart.js

Backend (.NET 8 Web API)
├── OpenAPI/Swagger documentation
├── NSwag client generation
├── Enhanced controllers with attributes
└── Existing service architecture

Development Workflow
├── API changes → Automatic client regeneration
├── Strong typing throughout
└── Reduced manual maintenance
```

## Development Workflow

### Current Workflow
1. Make backend API changes
2. Manually update frontend API service
3. Update TypeScript interfaces
4. Test integration manually

### Target Workflow (Post-NSwag)
1. Make backend API changes with OpenAPI attributes
2. Build triggers automatic client generation
3. Frontend automatically gets updated types
4. Compile-time error checking ensures compatibility

## Success Metrics

### Phase 1C Success Criteria
- [ ] Complete removal of manual apiService.ts
- [ ] All existing functionality working with generated client
- [ ] Build process automatically regenerates client
- [ ] Full TypeScript type safety maintained
- [ ] Documentation updated with new workflow

### Overall Project Success Criteria
- [ ] Comprehensive user engagement analytics
- [ ] Individual user journey tracking
- [ ] Automated screen flow analysis
- [ ] Professional visualizations with export
- [ ] Real-time data processing capabilities
- [ ] Enterprise-ready performance and security

## Risk Mitigation

### Technical Risks
- **NSwag Integration Complexity**: Maintain current manual client as fallback
- **BigQuery Performance**: Implement intelligent caching and query optimization
- **Data Volume**: Plan for pagination and streaming early

### Development Risks
- **Scope Creep**: Maintain phase boundaries strictly
- **Integration Issues**: Comprehensive testing at each phase boundary
- **Performance Degradation**: Regular performance monitoring and optimization

---

*Last Updated: 2025-08-25 - Added Phase 1C (NSwag Integration) and updated architecture plans*