

































export type ClientSettingsGroupId =
  | 'general'
  | 'personalized'
  | 'listManagement'
  | 'picking'
  | 'notification'
  | 'history'
  | 'other'

export interface ClientSettingsGroupMeta {
  id: ClientSettingsGroupId
  
  order: number
  
  icon: string
  






  clientCaptionKey: string
}

export interface ClientSettingsCategoryMeta {
  
  id: string
  
  clientPageId: string
  groupId: ClientSettingsGroupId
  
  clientIcon: string
  
  icon: string
  










  order: number
  








  operable: boolean
}







export const CLIENT_SETTINGS_SNAPSHOT_SOURCE = {
  repo: 'SecRandom',
  clientCommit: 'e0b830a5',
  clientCatalogFile: 'SecRandom.Core/Services/ControlNode/ControlSettingsCatalog.cs',
  clientRegistrationFile: 'SecRandom/App.axaml.cs',
} as const
















export const CLIENT_SETTINGS_GROUPS: readonly ClientSettingsGroupMeta[] = [
  { id: 'general', order: 1, icon: 'Settings', clientCaptionKey: 'Settings_General' },
  { id: 'personalized', order: 2, icon: 'Palette', clientCaptionKey: 'Settings_Personalized' },
  { id: 'listManagement', order: 3, icon: 'List', clientCaptionKey: 'Settings_RosterManagement' },
  { id: 'picking', order: 4, icon: 'Dices', clientCaptionKey: 'Settings_Draw' },
  { id: 'notification', order: 5, icon: 'MessageSquare', clientCaptionKey: 'Settings_Notification' },
  { id: 'history', order: 6, icon: 'History', clientCaptionKey: 'Feat_History' },
  
  { id: 'other', order: 99, icon: 'Ellipsis', clientCaptionKey: '' },
]














export const CLIENT_SETTINGS_CATEGORIES: readonly ClientSettingsCategoryMeta[] = [
  {
    id: 'general',
    clientPageId: 'settings.general.basic',
    groupId: 'general',
    clientIcon: 'WrenchSettingsFilled',
    icon: 'Settings',
    order: 1,
    operable: false,
  },
  













  {
    id: 'appearance',
    clientPageId: 'settings.personalized.appearance',
    groupId: 'personalized',
    clientIcon: 'LayerDiagonalSparkleFilled',
    icon: 'Palette',
    order: 3,
    operable: true,
  },
  {
    







    id: 'float_position',
    clientPageId: 'settings.personalized.floatingWindow',
    groupId: 'personalized',
    clientIcon: 'WindowAppsFilled',
    icon: 'Move',
    order: 4,
    
    operable: false,
  },
  {
    id: 'floating_window',
    clientPageId: 'settings.personalized.floatingWindow',
    groupId: 'personalized',
    clientIcon: 'WindowAppsFilled',
    icon: 'AppWindow',
    order: 5,
    operable: true,
  },
  {
    







    id: 'timer',
    clientPageId: 'settings.personalized.timer',
    groupId: 'personalized',
    clientIcon: 'TimerFilled',
    icon: 'Timer',
    order: 6,
    operable: true,
  },
  {
    
    
    id: 'linkage',
    clientPageId: 'settings.linkage',
    groupId: 'personalized',
    clientIcon: 'CalendarLtrFilled',
    icon: 'Calendar',
    order: 7,
    operable: true,
  },
  {
    
    
    id: 'more',
    clientPageId: 'settings.more',
    groupId: 'personalized',
    clientIcon: 'MoreHorizontalFilled',
    icon: 'Ellipsis',
    order: 8,
    operable: true,
  },
  {
    id: 'default_draw',
    clientPageId: 'settings.picking.default',
    groupId: 'picking',
    clientIcon: 'DocumentBulletListCubeFilled',
    icon: 'ListChecks',
    order: 9,
    operable: true,
  },
  {
    id: 'roll_call',
    clientPageId: 'settings.picking.rollCall',
    groupId: 'picking',
    clientIcon: 'PersonFilled',
    icon: 'Users',
    order: 10,
    operable: true,
  },
  {
    id: 'quick_draw',
    clientPageId: 'settings.picking.quickDraw',
    groupId: 'picking',
    clientIcon: 'FlashFilled',
    icon: 'Zap',
    order: 11,
    operable: true,
  },
  {
    id: 'lottery',
    clientPageId: 'settings.picking.lottery',
    groupId: 'picking',
    clientIcon: 'LotteryFilled',
    icon: 'Ticket',
    order: 12,
    operable: true,
  },
  {
    
    
    id: 'voice',
    clientPageId: 'settings.notification.voiceMusic',
    groupId: 'notification',
    clientIcon: 'PersonVoiceFilled',
    icon: 'Volume2',
    order: 13,
    operable: true,
  },
  {
    id: 'notification',
    clientPageId: 'settings.notification.default',
    groupId: 'notification',
    clientIcon: 'CommentNoteFilled',
    icon: 'MessageSquare',
    order: 14,
    operable: true,
  },
  {
    id: 'history',
    clientPageId: 'settings.history.management',
    groupId: 'history',
    clientIcon: 'HistoryFilled',
    icon: 'History',
    order: 15,
    operable: false,
  },
  {
    id: 'update',
    clientPageId: 'settings.update',
    groupId: 'other',
    clientIcon: 'ArrowSyncFilled',
    icon: 'RefreshCw',
    order: 16,
    operable: false,
  },
  {
    





    id: 'fair_draw',
    clientPageId: '',
    groupId: 'general',
    clientIcon: '',
    icon: 'ShieldCheck',
    order: 17,
    operable: false,
  },
]

const CATEGORY_BY_ID = new Map(CLIENT_SETTINGS_CATEGORIES.map((meta) => [meta.id, meta]))








export function categoryMetaOf(categoryId: string): ClientSettingsCategoryMeta {
  const known = CATEGORY_BY_ID.get(categoryId)
  if (known !== undefined) return known

  return {
    id: categoryId,
    clientPageId: '',
    groupId: 'other',
    clientIcon: '',
    icon: 'Settings',
    order: Number.MAX_SAFE_INTEGER,
    operable: false,
  }
}

export const OTHER_GROUP: ClientSettingsGroupMeta =
  CLIENT_SETTINGS_GROUPS.find((group) => group.id === 'other') ?? {
    id: 'other',
    order: 99,
    icon: 'Ellipsis',
    clientCaptionKey: '',
  }
