
















export const FLUENT_ICONS = {
  
  navigation: 0xebd3,
  
  arrowLeft: 0xe108,
  
  backspace: 0xe1bc,
  
  search: 0xeef2,
  
  person: 0xece4,
  
  home: 0xe993,
  
  settings: 0xef26,
  
  shield: 0xef4e,
  
  checkmark: 0xe423,
  
  databaseWindow: 0xe616,
  
  arrowSync: 0xe160,
  
  color: 0xe51d,
  
  speaker2: 0xf00c,
  
  appsList: 0xe074,
  
  peopleList: 0xecc4,
  
  gift: 0xe8ec,
  
  flash: 0xe84e,
  
  personVoice: 0xed52,
  
  commentNote: 0xe558,
  
  history: 0xe98f,
  
  puzzlePiece: 0xee28,
  
  megaphone: 0xeb6f,
  
  arrowClockwise: 0xe0b4,
  
  info: 0xe9e3,
  
  chevronDown: 0xe447,
  
  clipboardBulletList: 0xe487,
  
  textFont: 0xf26e,
  
  subtract: 0xf09c,
  
  add: 0xe00c,
  
  image: 0xe9b1,
  
  personAdd: 0xecec,
  
  peopleAdd: 0xecac,
  
  arrowDownload: 0xe0d2,
  
  settingsCogMultiple: 0xef2a,
  
  edit: 0xe7c8,
  
  delete: 0xe61c,
} as const

export type FluentIconName = keyof typeof FLUENT_ICONS







export const FLUENT_ICON_FALLBACK: FluentIconName = 'settings'






const ALIASES: Record<string, FluentIconName> = {
  
  layerDiagonalSparkle: 'color',
  palette: 'color',
  
  windowApps: 'databaseWindow',
  
  window: 'databaseWindow',
  
  lottery: 'gift',
  
  wrenchSettings: 'settings',
  
  shieldKeyhole: 'shield',
  shieldCheckmark: 'shield',
  
  documentBulletListCube: 'clipboardBulletList',
  
  darkTheme: 'color',
  
  textBold: 'textFont',
  






  pin: 'databaseWindow',
  dock: 'databaseWindow',
  grid: 'appsList',
  resizeLarge: 'appsList',
  textBulletListSquare: 'textFont',
  gesture: 'appsList',
  




  link: 'arrowSync',
  database: 'databaseWindow',
  calendarLtr: 'history',
  




  cardUi: 'appsList',
  dataHistogram: 'flash',
  tag: 'settingsCogMultiple',
  slidePlay: 'flash',
  numberSymbol: 'flash',
  
  personFilled: 'person',
  





  moreHorizontal: 'appsList',
  panelRight: 'appsList',
  keyboard: 'flash',
  




  timer: 'history',
  timePicker: 'history',
  
  clock: 'history',
  hourglass: 'history',
  
  globe: 'arrowSync',
  
  mic: 'personVoice',
  
  topSpeed: 'flash',
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1)
}










export function normalizeFluentIconName(raw: string): string {
  let name = raw.trim()
  if (name.length === 0) return name

  if (name.startsWith('ic_fluent_')) name = name.slice('ic_fluent_'.length)

  
  name = name.replace(/_?\d+_(filled|regular)$/i, '').replace(/_(filled|regular)$/i, '')

  
  name = name.replace(/(Filled|Regular)$/, '')

  const parts = name.split(/[_\-\s]+/).filter((part) => part.length > 0)
  if (parts.length === 0) return ''

  
  const head = parts[0]!
  const camel = /^[A-Z]/.test(head) ? head[0]!.toLowerCase() + head.slice(1) : head
  return camel + parts.slice(1).map(capitalize).join('')
}


export function resolveFluentIconName(raw: string): FluentIconName | null {
  const normalized = normalizeFluentIconName(raw)
  if (normalized in FLUENT_ICONS) return normalized as FluentIconName

  const alias = ALIASES[normalized]
  return alias ?? null
}






export function fluentGlyph(raw: string): string {
  const name = resolveFluentIconName(raw) ?? FLUENT_ICON_FALLBACK
  return String.fromCodePoint(FLUENT_ICONS[name])
}


export function hasFluentIcon(raw: string): boolean {
  return resolveFluentIconName(raw) !== null
}
