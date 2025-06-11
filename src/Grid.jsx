import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, ClientSideRowModelModule, themeAlpine, ColumnAutoSizeModule } from 'ag-grid-community'
import { useState, useEffect, useRef } from 'react'
import { Command } from 'amps'

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

const Grid = ({ client, width, height, columnDefs, topic, orderBy, options }) => {
  // the state of the component is the a list of row objects
  const [rowData, setRowData] = useState([])

  // create and keep a reference to the subscription id
  const subIdRef = useRef()

  useEffect(() => {
    return () => {
      // if there's an active subscription at a time of component destruction, remove it
      if (subIdRef.current) {
        client.unsubscribe(subIdRef.current)
      }
    }
  }, [client]) // we only need to invoke the hook callback when a new client prop provided (will be called once)

  return (
    <div className='ag-container' style={{ height: height ?? 600, width: width ?? 600 }}>
      <AgGridReact
        theme={themeAlpine}
        columnDefs={columnDefs}
        // we now use state to track row data changes
        rowData={rowData}
        // unique identification of the row based on the SowKey
        getRowId={({ data: { key } }) => key}
        // resize columns on grid resize
        onGridSizeChanged={({ api }) => api.sizeColumnsToFit()}
        // the provided callback is invoked once the grid is initialized
        onGridReady={async ({ api }) => {
          // this is the place where we issue a "sow_and_subscribe" command
          // resize columns to fit the width of the grid
          api.sizeColumnsToFit()

          // create a command object
          const command = new Command('sow_and_subscribe')
          command.topic(topic)
          command.orderBy(orderBy)
          command.options(options)

          try {
            // subscribe to the topic data and atomic updates
            let rows

            // store the subscription id
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
            setRowData([])
            console.error('err: ', err)
          }
        }}

      />
    </div>
  )
}

export default Grid