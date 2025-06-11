import Grid from './Grid.tsx'
import './App.css'
import { useState, useEffect } from 'react'
import { Client, DefaultServerChooser, DefaultSubscriptionManager } from 'amps'
import { curCol } from './helpers.ts'

// constants
const HOST = import.meta.env.VITE_AMPS_HOST
const PORT = import.meta.env.VITE_AMPS_PORT

const App: React.FC = () => {
  // the state of the component will be an AMPS Client object
  const [client, setClient] = useState<Client | undefined>(undefined)

  useEffect(() => {
    // create the server chooser
    const chooser = new DefaultServerChooser()
    chooser.add(`ws://${HOST}:${PORT}/amps/json`)

    // create the AMPS HA client object
    const client = new Client('view-server')
    client.serverChooser(chooser)
    client.subscriptionManager(new DefaultSubscriptionManager())

    // report general errors in the error handler, for example, message parsing error,
    // or an error thrown in the message handler
    client.errorHandler((err: Error) => console.error('Error: ', err))

    // now we can establish connection and update the state
    client.connect().then(() => setClient(client))

    // disconnect the client from AMPS when the component is destructed
    return () => {
      client.disconnect()
    }
  }, [])

  // client is not ready yet, render "Loading..." label only
  if (!client) {
    return (<div>Loading...</div>)
  }

  // Contents to render
  return (
    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
      <Grid
        showFilterBar={true}
        filter='LENGTH(/symbol) = 3'
        title='Top 20 Symbols by BID'
        height={1000}
        client={client}
        columnDefs={[
          { headerName: 'Symbol', field: 'symbol' },
          curCol({ headerName: 'Bid', field: 'bid', sort: 'desc' }),
          curCol({ headerName: 'Ask', field: 'ask' })
        ]}
        topic='market_data'
        // options='oof,conflation=3000ms,top_n=20,skip_n=0'
        options='oof,conflation=500ms,top_n=50,skip_n=0'
        orderBy='/bid DESC'
      />

      <Grid
        filter='LENGTH(/symbol) = 3'
        title='Top 50 Symbols by ASK'
        client={client}
        height={1000}
        columnDefs={[
          { headerName: 'Symbol', field: 'symbol' },
          curCol({ headerName: 'Bid', field: 'bid' }),
          curCol({ headerName: 'Ask', field: 'ask', sort: 'asc' })
        ]}
        topic='market_data'
        options='oof,conflation=500ms,top_n=50,skip_n=10'
        orderBy='/ask ASC'
      />
    </div>
  )
}

export default App 