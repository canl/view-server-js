import Grid from './Grid'
import './App.css'
import { useState, useEffect } from 'react'
import { Client, DefaultServerChooser, DefaultSubscriptionManager } from 'amps'
import { curCol } from './helpers'

// constants
const HOST = import.meta.env.VITE_AMPS_HOST
const PORT = import.meta.env.VITE_AMPS_PORT

const App = () => {
  // the state of the component will be an AMPS Client object
  const [client, setClient] = useState()

  useEffect(() => {
    // create the server chooser
    const chooser = new DefaultServerChooser()
    chooser.add(`ws://${HOST}:${PORT}/amps/json`)

    // create the AMPS HA client object
    const client = new Client('view-server')
    client.serverChooser(chooser)
    client.subscriptionManager(new DefaultSubscriptionManager())

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
        title='Top 20 Symbols by BID'
        client={client}
        columnDefs={[
          { headerName: 'Symbol', field: 'symbol' },
          curCol({ headerName: 'Bid', field: 'bid', sort: 'desc' }),
          curCol({ headerName: 'Ask', field: 'ask' })
        ]}
        topic='market_data'
        options='oof,conflation=3000ms,top_n=20,skip_n=0'
        orderBy='/bid DESC'
      />

      <Grid
        title='Top 50 Symbols by ASK'
        client={client}
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