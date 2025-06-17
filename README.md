# View Server Application with AMPS, React, and AG Grid

This project is a real-time market data viewer built with [AMPS](https://www.crankuptheamps.com/), [React](https://react.dev/), and [AG Grid](https://www.ag-grid.com/). It demonstrates how to connect to an AMPS server, subscribe to live data, and display it in a powerful, filterable, and sortable data grid.

---

## Features

- **Real-time data** from AMPS
- **Modern React UI** (Vite + TypeScript)
- **AG Grid** for fast, interactive tables
- **Column filtering, sorting, and resizing**
- **Responsive layout** (side-by-side or stacked grids)
- **Theme support** (Quartz, Alpine, Material, etc.)
- **Reusable hooks** for AMPS connection and data management

---

## Getting Started

### 1. **Install dependencies**
```sh
npm install
```

### 2. **Configure AMPS connection**
Set your AMPS host and port in a `.env` file:
```
VITE_AMPS_HOST=your-amps-host
VITE_AMPS_PORT=your-amps-port
```

### 3. **Run the app**
```sh
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
src/
  App.tsx           # Main app, renders two AG Grids with AMPS data
  Grid.tsx          # Reusable grid component (AG Grid + AMPS)
  hooks/
    useAmps.ts      # AMPS connection logic
    useGridData.ts  # Data subscription and management
  constants.ts      # App-wide constants
  helpers.ts        # Utility functions
  FilterBar.tsx     # Optional filter bar UI
  ...
```

---

## AG Grid Filtering Setup

- **Import and register filter modules:**
  ```js
  import { TextFilterModule, NumberFilterModule, DateFilterModule } from 'ag-grid-community';
  ModuleRegistry.registerModules([TextFilterModule, NumberFilterModule, DateFilterModule, ...]);
  ```
- **Enable filters in `defaultColDef`:**
  ```js
  defaultColDef={{
    filter: true,
    floatingFilter: true,
    sortable: true,
    resizable: true,
  }}
  ```

---

## Customization

- **Themes:** Change the theme by updating the CSS import and container class (e.g., `ag-theme-quartz`).
- **Columns:** Edit `columnDefs` in `App.tsx` to show different fields or change filter types.
- **AMPS Topics:** Update the `topic` prop to subscribe to different AMPS data streams.

---

## Resources

- [AMPS Documentation](https://www.crankuptheamps.com/documentation/html/)
- [AG Grid React Docs](https://www.ag-grid.com/react-data-grid/)
- [React Documentation](https://react.dev/)
- [React AMPS Sample](https://devnull.crankuptheamps.com/~pavel/view-server-tutorial/#chapter-11-connection-state-and-error-handling)
