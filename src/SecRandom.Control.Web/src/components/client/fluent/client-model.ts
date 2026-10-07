












export interface ClientSelectOption {
  value: string
  label: string
}







export interface ClientCommand {
  id: string
  label: string
  
  icon: string
  disabled?: boolean
  
  separatorBefore?: boolean
  
  title?: string
  testId?: string
}







export interface PanelNotice {
  tone: 'info' | 'warn' | 'ok' | 'fail'
  text: string
  testId?: string
}


export type PanelStatus = 'idle' | 'reading' | 'ready' | 'unavailable' | 'failed'









export type ClientSettingControl = 'toggle' | 'select' | 'number' | 'text' | 'readonly' | 'hotkey'







export interface ClientSettingControlSpec {
  path: string
  
  title: string
  control: ClientSettingControl
  
  options?: readonly ClientSelectOption[] | null
  min?: number | null
  max?: number | null
  
  step?: number | null
  
  readonly?: boolean
}


export interface ClientPageNavItem {
  id: string
  label: string
  icon: string
}


export interface ClientPageNavGroup {
  id: string
  label: string
  items: readonly ClientPageNavItem[]
}








export interface ClientSettingsPanelState {
  status: PanelStatus
  canRead: boolean
  canWrite: boolean
  busy: boolean
  
  dirtyCount: number
  notices: readonly PanelNotice[]
}


export interface ClientRosterPanelState {
  status: PanelStatus
  canRead: boolean
  canPush: boolean
  busy: boolean
  notices: readonly PanelNotice[]
}
