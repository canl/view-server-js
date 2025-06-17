import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, ClientSideRowModelModule, themeAlpine, ColumnAutoSizeModule, colorSchemeDark, ColDef, GridApi, GridReadyEvent, ValidationModule, CellStyleModule } from 'ag-grid-community'
import { useEffect } from 'react'
import { Client } from 'amps'
import FilterBar from './FilterBar.tsx'
import { useGridData } from './hooks/useGridData'
import { CONNECTION_STATUS, DEFAULTS } from './constants'

ModuleRegistry.registerModules([ClientSideRowModelModule, ColumnAutoSizeModule, ValidationModule, CellStyleModule])

interface GridProps {
  showFilterBar?: boolean;
  filter?: string;
  title: string;
  client: Client;
  width?: number;
  height?: number;
  columnDefs: ColDef[];
  topic: string;
  orderBy: string;
  options: string;
  connectionStatus?: string;
  error?: string;
}

const Grid: React.FC<GridProps> = ({ 
  showFilterBar, 
  filter, 
  title, 
  client, 
  width, 
  height, 
  columnDefs, 
  topic, 
  orderBy, 
  options,
  connectionStatus = DEFAULTS.CONNECTION_STATUS,
  error
}) => {
  const { rowData, filterInput, sowAndSubscribe } = useGridData({
    client,
    topic,
    orderBy,
    options,
    filter,
    title
  })

  useEffect(() => {
    // Clear data when connection is lost
    if (connectionStatus === CONNECTION_STATUS.RECONNECTING) {
      // The useGridData hook will handle clearing data when subscription is cleared
    }
  }, [connectionStatus])

  return (
    <div className='ag-container' style={{ height: height ?? DEFAULTS.GRID_HEIGHT, width: width ?? DEFAULTS.GRID_WIDTH }}>
      <div className='grid-header'>{title}</div>
      {showFilterBar && <FilterBar value={filterInput} onValueChange={sowAndSubscribe} />}
      <AgGridReact
        theme={themeAlpine.withPart(colorSchemeDark)}
        columnDefs={columnDefs}
        rowData={rowData}
        getRowId={({ data: { key } }) => key}
        onGridSizeChanged={({ api }) => api.sizeColumnsToFit()}
        animateRows={true}
        onGridReady={async ({ api }: GridReadyEvent) => {
          api.sizeColumnsToFit()
          sowAndSubscribe()
        }}
      />
      <div className='status-panel'>
        <span style={{ color: connectionStatus === CONNECTION_STATUS.CONNECTED ? 'green' : 'yellow' }}>{connectionStatus}</span>
        {error && <span style={{ float: 'right', color: 'red' }}>{error}</span>}
      </div>
    </div>
  )
}

export default Grid 