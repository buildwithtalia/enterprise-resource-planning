# ERP Monolith Frontend

React + TypeScript frontend for the Monolithic ERP System.

## Features

- 📊 **Dashboard** - Overview of all modules and system status
- 🏗️ **Architecture View** - Visual representation of monolithic design
- 8 **Module Pages** - HR, Payroll, Accounting, Finance, Billing, Procurement, Supply Chain, Inventory
- 🔗 **Cross-Module Dependencies** - Visualize tight coupling between modules
- 🎨 **Modern UI** - Built with Tailwind CSS
- ⚡ **Fast Development** - Vite for instant HMR

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Axios** - API requests

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will start on **http://localhost:5173**

### 3. Make sure the backend is running

The backend API should be running on **http://localhost:3001**

```bash
# In the parent directory
cd ..
npm run dev
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Layout.tsx
│   │   └── ModulePage.tsx
│   ├── pages/           # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Architecture.tsx
│   │   ├── HRModule.tsx
│   │   ├── PayrollModule.tsx
│   │   ├── AccountingModule.tsx
│   │   ├── FinanceModule.tsx
│   │   ├── BillingModule.tsx
│   │   ├── ProcurementModule.tsx
│   │   ├── SupplyChainModule.tsx
│   │   └── InventoryModule.tsx
│   ├── services/        # API integration
│   │   └── api.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Features by Page

### Dashboard
- System health status
- Module overview cards
- Cross-module dependency visualization
- Quick stats

### Architecture
- Monolithic architecture diagram
- Module dependency graph
- Advantages and disadvantages
- Cross-coupling examples with code references

### Module Pages
Each module page includes:
- Module statistics (when database is connected)
- Feature list
- Cross-module dependencies
- Integration details

## API Integration

The frontend communicates with the backend API through a proxy configured in `vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  }
}
```

All API calls are made through the `src/services/api.ts` service layer.

## Styling

This project uses **Tailwind CSS** with custom utility classes:

- `.btn-primary` - Primary button style
- `.btn-secondary` - Secondary button style
- `.card` - Standard card container
- `.stat-card` - Statistics card with left border

Custom color palette defined in `tailwind.config.js` with primary blue shades.

## Building for Production

```bash
npm run build
```

Builds the app for production to the `dist` folder. The build is optimized and ready for deployment.

## Environment Variables

No environment variables are required. The API URL is proxied through Vite in development and should be configured at the web server level in production.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Monolithic Design Highlights

The frontend demonstrates the backend's monolithic architecture:

1. **Unified Navigation** - Single sidebar accessing all modules
2. **Shared State** - All modules loaded in same app
3. **Direct Integration** - No separate frontends per module
4. **Consistent UI** - Shared components and styles
5. **Single Deployment** - One build for entire system

This mirrors the backend's single deployable unit architecture.
