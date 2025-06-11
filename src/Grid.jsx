import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, ClientSideRowModelModule, themeAlpine, ColumnAutoSizeModule, colorSchemeDark } from 'ag-grid-community'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Command, Client } from 'amps'
import FilterBar from './FilterBar'

ModuleRegistry.registerModules([ClientSideRowModelModule, ColumnAutoSizeModule])


const matcher = ({ header }) => ({ key }) => key === header.sowKey()

const processOOF = (message, rowData) => {
  const rowIndex = rowData.findIndex(matcher(message))

  if (rowIndex >= 0) {
    const rows = rowData.filter(({ key }) => key !== message.header.sowKey())
    return rows
  }

  return rowData
}

const processPublish = (message, rowData) => {
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

const Grid = ({ showFilterBar, filter, title, client, width, height, columnDefs, topic, orderBy, options }) => {
  const [connectionStatus, setConnectionStatus] = useState('Connected')
  const [error, setError] = useState()


  // the state of the component is the a list of row objects
  const [rowData, setRowData] = useState([])

  // create and keep a reference to the subscription id
  const subIdRef = useRef()

  useEffect(() => {
    // subscribe for the connection events
    const listenerId = client.addConnectionStateListener(state => {
      if (state === Client.ConnectionStateListener.LoggedOn) {
        setConnectionStatus('Connected')
      } else if (state === Client.ConnectionStateListener.Disconnected) {
        setRowData([])
        setConnectionStatus('Reconnecting...')
      }
    })

    return () => {
      // if there's an active subscription at a time of component destruction, remove it
      if (subIdRef.current) {
        client.unsubscribe(subIdRef.current)
      }
      // remove the connection state listener when the component is destructed
      client.removeConnectionStateListener(listenerId)
    }
  }, [client]) // we only need to invoke the hook callback when a new client prop provided (will be called once)

  // new filter state value hook
  const [filterInput, setFilterInput] = useState(filter || '')
  
  const sowAndSubscribe = useCallback(async filter => {
    if (filter !== undefined) {
      if (filter !== filterInput) {
        setFilterInput(filter || '')
      } else {
        return
      }
    } else {
      filter = filterInput
    }

    // clear previous errors, if any
    if (error) {
      setError('')
    }

    // if we had a running subscription already, we need to unsubscribe from it
    if (subIdRef.current) {
      client.unsubscribe(subIdRef.current)
      subIdRef.current = undefined

      // update state
      setRowData([])
    }

    // create a command object
    const command = new Command('sow_and_subscribe')
    command.topic(topic)
    command.orderBy(orderBy)
    command.options(options)

    if (filter) {
      command.filter(filter)
    }

    try {
      // subscribe to the topic data and atomic updates
      let rows
      subIdRef.current = await client.execute(command, message => {
        switch (message.header.command()) {
          case 'group_begin': // Begin receiving the initial dataset
            rows = []
            break
          case 'sow': // This message is a part of the initial dataset
            message.data.key = message.header.sowKey()
            rows.push(message.data)
            break
          case 'group_end': // Initial Dataset has been delivered
            setRowData(rows)
            break
          case 'oof': // Out-of-Focus -- a message should no longer be in the grid
            rows = processOOF(message, rows)
            setRowData(rows)
            break
          default: // Publish -- either a new message or an update
            rows = processPublish(message, rows)
            setRowData(rows)
        }
      })
    } catch (err) {
      setError(`Error: ${err.message}`)
    }
  }, [client, error, filterInput, options, orderBy, topic]) // we list dependencies used in the above function

  return (
    <div className='ag-container' style={{ height: height ?? 600, width: width ?? 600 }}>
      <div className='grid-header'>{title}</div>
      {showFilterBar && <FilterBar value={filterInput} onValueChange={sowAndSubscribe} />}
      <AgGridReact
        theme={themeAlpine.withPart(colorSchemeDark)}
        columnDefs={columnDefs}
        // we now use state to track row data changes
        rowData={rowData}
        // unique identification of the row based on the SowKey
        getRowId={({ data: { key } }) => key}
        // resize columns on grid resize
        onGridSizeChanged={({ api }) => api.sizeColumnsToFit()}
        animateRows={true}
        // the provided callback is invoked once the grid is initialized
        onGridReady={async ({ api }) => {
          // resize columns to fit the width of the grid
          api.sizeColumnsToFit()
          // notice that we've moved the subscription code from here
          // and simply call the newly created function instead
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