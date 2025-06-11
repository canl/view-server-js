import Grid from './Grid'
import './App.css'
import { useState, useEffect } from 'react'
import { Client, DefaultServerChooser, DefaultSubscriptionManager } from 'amps'

// constants
const HOST = '34.68.65.149'
const PORT = '9008'

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
  return (<Grid client={client} />)
}

export default App