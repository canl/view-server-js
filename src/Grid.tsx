import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, ClientSideRowModelModule, themeAlpine, ColumnAutoSizeModule, colorSchemeDark, ColDef, GridApi, GridReadyEvent, ValidationModule, CellStyleModule } from 'ag-grid-community'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Command, Client } from 'amps'
import FilterBar from './FilterBar.tsx'

ModuleRegistry.registerModules([ClientSideRowModelModule, ColumnAutoSizeModule, ValidationModule, CellStyleModule])

interface Message {
  header: {
    command: () => string;
    sowKey: () => string;
  };
  data: any;
}

interface RowData {
  key: string;
  symbol: string;
  bid: number;
  ask: number;
  [key: string]: any;
}

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
}

const matcher = ({ header }: Message) => ({ key }: { key: string }) => key === header.sowKey()

const processOOF = (message: Message, rowData: RowData[]): RowData[] => {
  const rowIndex = rowData.findIndex(matcher(message))

  if (rowIndex >= 0) {
    const rows = rowData.filter(({ key }) => key !== message.header.sowKey())
    return rows
  }

  return rowData
}

const processPublish = (message: Message, rowData: RowData[]): RowData[] => {
  const rowIndex = rowData.findIndex(matcher(message))
  const rows = rowData.slice()

  if (rowIndex >= 0) {
    rows[rowIndex] = { ...rows[rowIndex], ...message.data }
  } else {
    message.data.key = message.header.sowKey()
    rows.push(message.data)
  }

  return rows
}

const Grid: React.FC<GridProps> = ({ showFilterBar, filter, title, client, width, height, columnDefs, topic, orderBy, options }) => {
  const [connectionStatus, setConnectionStatus] = useState('Connected')
  const [error, setError] = useState<string>()
  const [rowData, setRowData] = useState<RowData[]>([])
  const subIdRef = useRef<string | null>(null)

  useEffect(() => {
    const listenerId = client.addConnectionStateListener(state => {
      if (state === Client.ConnectionStateListener.LoggedOn) {
        setConnectionStatus('Connected')
      } else if (state === Client.ConnectionStateListener.Disconnected) {
        setRowData([])
        setConnectionStatus('Reconnecting...')
      }
    })

    return () => {
      if (subIdRef.current) {
        client.unsubscribe(subIdRef.current)
      }
      client.removeConnectionStateListener(listenerId)
    }
  }, [client])

  const [filterInput, setFilterInput] = useState(filter || '')
  
  const sowAndSubscribe = useCallback(async (newFilter?: string) => {
    if (newFilter !== undefined) {
      if (newFilter !== filterInput) {
        setFilterInput(newFilter || '')
      } else {
        return
      }
    } else {
      newFilter = filterInput
    }

    if (error) {
      setError('')
    }

    if (subIdRef.current) {
      client.unsubscribe(subIdRef.current)
      subIdRef.current = null
      setRowData([])
    }

    const command = new Command('sow_and_subscribe')
    command.topic(topic)
    command.orderBy(orderBy)
    command.options(options)

    if (newFilter) {
      command.filter(newFilter)
    }

    try {
      let rows: any[] = []
      subIdRef.current = await client.execute(command, (message: Message) => {
        switch (message.header.command()) {
          case 'group_begin':
            rows = []
            break
          case 'sow':
            message.data.key = message.header.sowKey()
            rows.push(message.data)
            break
          case 'group_end':
            setRowData(rows)
            break
          case 'oof':
            rows = processOOF(message, rows)
            setRowData(rows)
            break
          default:
            rows = processPublish(message, rows)
            setRowData(rows)
        }
      })
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    }
  }, [client, error, filterInput, options, orderBy, topic])

  return (
    <div className='ag-container' style={{ height: height ?? 600, width: width ?? 600 }}>
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
        <span style={{ color: connectionStatus === 'Connected' ? 'green' : 'yellow' }}>{connectionStatus}</span>
        <span style={{ float: 'right', color: 'red' }}>{error}</span>
      </div>
    </div>
  )
}

export default Grid 