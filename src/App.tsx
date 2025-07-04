import Grid from './Grid.tsx'
import './App.css'
import { useAmps } from './hooks/useAmps'
import { curCol } from './helpers.ts'
import GridTest from './GridTest.tsx'

// constants
const HOST = import.meta.env.VITE_AMPS_HOST
const PORT = import.meta.env.VITE_AMPS_PORT

const App: React.FC = () => {
  const { client, connectionStatus, error } = useAmps({ host: HOST, port: PORT })

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
        client={client}
        columnDefs={[
          { headerName: 'Symbol', field: 'symbol', filter: "agTextColumnFilter" },
          curCol({ headerName: 'Bid', field: 'bid', sort: 'desc' }),
          curCol({ headerName: 'Ask', field: 'ask' })
        ]}
        topic='market_data'
        options='oof,conflation=500ms,top_n=20,skip_n=0'
        orderBy='/bid DESC'
        connectionStatus={connectionStatus}
        error={error}
      />

      <Grid
        filter='LENGTH(/symbol) = 3'
        title='Top 50 Symbols by ASK'
        client={client}
        columnDefs={[
          { headerName: 'Symbol', field: 'symbol', filter: "agSetColumnFilter" },
          curCol({ headerName: 'Bid', field: 'bid' }),
          curCol({ headerName: 'Ask', field: 'ask', sort: 'asc' })
        ]}
        topic='market_data'
        options='oof,conflation=500ms,top_n=50,skip_n=10'
        orderBy='/ask ASC'
        connectionStatus={connectionStatus}
        error={error}
      />
    </div>
  )
}

export default App 