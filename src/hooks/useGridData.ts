import { useState, useRef, useCallback } from 'react'
import { Command, Client } from 'amps'
import { AMPS_COMMANDS, ERROR_MESSAGES } from '../constants'

interface AmpsMessageData {
  key?: string;
  [key: string]: unknown;
}

interface Message {
  header: {
    command: () => string;
    sowKey: () => string;
  };
  data: AmpsMessageData;
}

interface RowData {
  key: string;
  [key: string]: unknown;
}

interface UseGridDataProps {
  client: Client;
  topic: string;
  orderBy: string;
  options: string;
  filter?: string;
  title: string;
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
    rows.push(message.data as RowData)
  }

  return rows
}

export const useGridData = ({ client, topic, orderBy, options, filter, title }: UseGridDataProps) => {
  const [rowData, setRowData] = useState<RowData[]>([])
  const [filterInput, setFilterInput] = useState(filter || '')
  const subIdRef = useRef<string | null>(null)

  const clearSubscription = useCallback(() => {
    if (subIdRef.current) {
      client.unsubscribe(subIdRef.current)
      subIdRef.current = null
      setRowData([])
    }
  }, [client])

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

    clearSubscription()

    const command = new Command(AMPS_COMMANDS.SOW_AND_SUBSCRIBE)
    command.topic(topic)
    command.orderBy(orderBy)
    command.options(options)

    if (newFilter) {
      command.filter(newFilter)
    }

    try {
      let rows: RowData[] = []
      subIdRef.current = await client.execute(command, (message: Message) => {
        switch (message.header.command()) {
          case AMPS_COMMANDS.GROUP_BEGIN:
            rows = []
            break
          case AMPS_COMMANDS.SOW:
            message.data.key = message.header.sowKey()
            rows.push(message.data as RowData)
            break
          case AMPS_COMMANDS.GROUP_END:
            setRowData(rows)
            break
          case AMPS_COMMANDS.OOF:
            rows = processOOF(message, rows)
            setRowData(rows)
            break
          default:
            rows = processPublish(message, rows)
            setRowData(rows)
        }
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN_ERROR
      console.error(`Error in ${title}:`, errorMessage)
    }
  }, [client, filterInput, options, orderBy, topic, title, clearSubscription])

  return {
    rowData,
    filterInput,
    sowAndSubscribe,
    clearSubscription
  }
} 