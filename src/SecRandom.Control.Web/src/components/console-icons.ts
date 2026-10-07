


























export const CONSOLE_FLUENT_ICONS = {
  
  ArrowLeft: 0xe108,
  
  ArrowRight: 0xe130,
  
  LayoutDashboard: 0xe993,
  
  RefreshCw: 0xe0b4,
  
  Plus: 0xe00c,
  
  Trash2: 0xe61c,
  
  Pencil: 0xe7c8,
  
  Rename: 0xee7c,
  
  X: 0xe670,
  
  Check: 0xe423,
  
  Copy: 0xe58a,
  
  Lock: 0xeaef,
  
  LockOpen: 0xeaf7,
  
  Megaphone: 0xeb6f,
  





  Settings: 0xef26,
  
  Zap: 0xe84e,
  
  Monitor: 0xe62e,
  
  Ticket: 0xf352,
  
  Link2: 0xeaaf,
  
  ArrowRightLeft: 0xe15e,
  
  Clock: 0xe4c3,
  
  TriangleAlert: 0xe024,
  
  ShieldCheck: 0xef56,
  
  Shield: 0xef4e,
  
  Users: 0xecaa,
  
  UsersList: 0xecc4,
  
  UserPlus: 0xecec,
  
  CircleCheck: 0xe425,
  
  Info: 0xe9e3,
  
  Sun: 0xf464,
  
  Moon: 0xf44a,
  
  ChevronDown: 0xe447,
  
  ChevronUp: 0xe44f,
  
  ChevronRight: 0xe44d,
  
  FileText: 0xe686,
  
  History: 0xe98f,
  
  MoreVertical: 0xee46,
} as const

export type ConsoleFluentIconName = keyof typeof CONSOLE_FLUENT_ICONS


export function hasConsoleFluentIcon(name: string): name is ConsoleFluentIconName {
  return name in CONSOLE_FLUENT_ICONS
}


export function consoleFluentCodePoint(name: string): number | null {
  return hasConsoleFluentIcon(name) ? CONSOLE_FLUENT_ICONS[name] : null
}


export function consoleFluentGlyph(name: string): string {
  const codepoint = consoleFluentCodePoint(name)
  return codepoint === null ? '' : String.fromCodePoint(codepoint)
}
