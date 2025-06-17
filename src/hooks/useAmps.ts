import { useState, useEffect } from 'react'
import { Client, DefaultServerChooser, DefaultSubscriptionManager } from 'amps'
import { CONNECTION_STATUS, ERROR_MESSAGES } from '../constants'

interface UseAmpsProps {
  host: string;
  port: string;
  clientName?: string;
}

type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS]

export const useAmps = ({ host, port, clientName = 'view-server' }: UseAmpsProps) => {
  const [client, setClient] = useState<Client | undefined>(undefined)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(CONNECTION_STATUS.CONNECTING)
  const [error, setError] = useState<string>()

  useEffect(() => {
    // create the server chooser
    const chooser = new DefaultServerChooser()
    chooser.add(`ws://${host}:${port}/amps/json`)

    // create the AMPS HA client object
    const ampsClient = new Client(clientName)
    ampsClient.serverChooser(chooser)
    ampsClient.subscriptionManager(new DefaultSubscriptionManager())

    // report general errors in the error handler
    ampsClient.errorHandler((err: Error) => {
      console.error('Error: ', err)
      setError(err.message)
    })

    // subscribe for the connection events
    const listenerId = ampsClient.addConnectionStateListener(state => {
      if (state === Client.ConnectionStateListener.LoggedOn) {
        setConnectionStatus(CONNECTION_STATUS.CONNECTED)
        setError(undefined)
      } else if (state === Client.ConnectionStateListener.Disconnected) {
        setConnectionStatus(CONNECTION_STATUS.RECONNECTING)
      }
    })

    // establish connection and update the state
    ampsClient.connect().then(() => setClient(ampsClient))

    // cleanup
    return () => {
      ampsClient.removeConnectionStateListener(listenerId)
      ampsClient.disconnect()
    }
  }, [host, port, clientName])

  return {
    client,
    connectionStatus,
    error
  }
} 