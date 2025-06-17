// AMPS Command Types
export const AMPS_COMMANDS = {
  GROUP_BEGIN: 'group_begin',
  SOW: 'sow',
  GROUP_END: 'group_end',
  OOF: 'oof',
  SOW_AND_SUBSCRIBE: 'sow_and_subscribe'
} as const

// Connection Status
export const CONNECTION_STATUS = {
  CONNECTED: 'Connected',
  RECONNECTING: 'Reconnecting...',
  CONNECTING: 'Connecting...'
} as const

// Default Values
export const DEFAULTS = {
  GRID_HEIGHT: 600,
  GRID_WIDTH: 600,
  CONNECTION_STATUS: CONNECTION_STATUS.CONNECTED
} as const

// Error Messages
export const ERROR_MESSAGES = {
  UNKNOWN_ERROR: 'Unknown error',
  CONFIGURATION_MISSING: 'AMPS configuration is missing. Please check your environment variables.'
} as const 