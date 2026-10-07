




































export const CLIENT_SETTING_OPTION_LANGUAGES = ['zh-CN', 'en-US', 'ja-JP'] as const


export type ClientSettingOptionLanguage = (typeof CLIENT_SETTING_OPTION_LANGUAGES)[number]


export type OptionLabel = Partial<Record<ClientSettingOptionLanguage, string>>







export interface OptionLabelSet {
  
  [member: string]: OptionLabel
}


export interface OptionLabelSourceEntry {
  
  member: string
  








  resourceKey?: Partial<Record<ClientSettingOptionLanguage, string>>
  







  literal?: true
}


export interface OptionLabelSource {
  




  resourceDirectory: string | null
  
  entries: readonly OptionLabelSourceEntry[]
  







  xaml: {
    file: string
    anchor: string
    
    property: string
  } | null
}


export interface OptionLabelException {
  
  path: string
  
  member: string
  
  reason: string
}







export const CLIENT_SETTING_OPTION_LABELS: Readonly<Record<string, OptionLabelSet>> = {
  
  
  
  
  'default_draw.draw_mode': {
    Repeat: { 'zh-CN': '允许重复', 'en-US': 'Allow Repeats', 'ja-JP': '重複を許可' },
    NoRepeat: { 'zh-CN': '不重复', 'en-US': 'No Repeats', 'ja-JP': '重複なし' },
    HalfRepeat: { 'zh-CN': '半重复', 'en-US': 'Half Repeat', 'ja-JP': '半重複' },
  },
  'default_draw.use_global_font': {
    FollowGlobal: { 'zh-CN': '跟随全局', 'en-US': 'Follow Global', 'ja-JP': '全体設定に従う' },
    Custom: { 'zh-CN': '自定义', 'en-US': 'Custom', 'ja-JP': 'カスタム' },
  },
  'default_draw.display_style': {
    Default: { 'zh-CN': '默认', 'en-US': 'Default', 'ja-JP': '既定' },
    Card: { 'zh-CN': '卡片', 'en-US': 'Card', 'ja-JP': 'カード' },
  },
  'default_draw.display_format': {
    Both: { 'zh-CN': '编号和名称', 'en-US': 'Number and Name', 'ja-JP': '番号と名称' },
    Name: { 'zh-CN': '仅名称', 'en-US': 'Name Only', 'ja-JP': '名称のみ' },
    Id: { 'zh-CN': '仅编号', 'en-US': 'Number Only', 'ja-JP': '番号のみ' },
  },
  'default_draw.animation': {
    ManualStop: { 'zh-CN': '手动停止', 'en-US': 'Manual Stop', 'ja-JP': '手動停止' },
    AutoPlay: { 'zh-CN': '自动播放', 'en-US': 'Autoplay', 'ja-JP': '自動再生' },
    NoAnimation: { 'zh-CN': '无动画', 'en-US': 'No Animation', 'ja-JP': 'アニメーションなし' },
  },
  'default_draw.animation_style': {
    DirectRotate: { 'zh-CN': '直接轮换', 'en-US': 'Direct Rotation', 'ja-JP': '直接切り替え' },
    FadeFloat: { 'zh-CN': '淡入上浮', 'en-US': 'Fade and Float Up', 'ja-JP': 'フェードして上昇' },
    HorizontalShake: { 'zh-CN': '左右晃动', 'en-US': 'Horizontal Shake', 'ja-JP': '左右に揺らす' },
  },
  'default_draw.animation_color_theme': {
    None: { 'zh-CN': '无', 'en-US': 'None', 'ja-JP': 'なし' },
    Random: { 'zh-CN': '随机', 'en-US': 'Random', 'ja-JP': 'ランダム' },
    Fixed: { 'zh-CN': '固定颜色', 'en-US': 'Fixed Color', 'ja-JP': '固定色' },
  },
  'default_draw.student_image_position': {
    Left: { 'zh-CN': '左侧', 'en-US': 'Left', 'ja-JP': '左' },
    Top: { 'zh-CN': '上方', 'en-US': 'Top', 'ja-JP': '上' },
    Right: { 'zh-CN': '右侧', 'en-US': 'Right', 'ja-JP': '右' },
    Bottom: { 'zh-CN': '下方', 'en-US': 'Bottom', 'ja-JP': '下' },
  },

  
  'roll_call.draw_mode': {
    Repeat: { 'zh-CN': '允许重复', 'en-US': 'Allow Repeats', 'ja-JP': '重複を許可' },
    NoRepeat: { 'zh-CN': '不重复', 'en-US': 'No Repeats', 'ja-JP': '重複なし' },
    HalfRepeat: { 'zh-CN': '半重复', 'en-US': 'Half Repeat', 'ja-JP': '半重複' },
  },
  'roll_call.clear_record': {
    Restarted: { 'zh-CN': '重启后清除', 'en-US': 'Clear on Restart', 'ja-JP': '再起動後に消去' },
    Cleared: { 'zh-CN': '手动清除', 'en-US': 'Clear Manually', 'ja-JP': '手動で消去' },
  },
  'roll_call.use_global_font': {
    FollowGlobal: { 'zh-CN': '跟随全局', 'en-US': 'Follow Global', 'ja-JP': '全体設定に従う' },
    Custom: { 'zh-CN': '自定义', 'en-US': 'Custom', 'ja-JP': 'カスタム' },
  },
  'roll_call.display_format': {
    Both: { 'zh-CN': '编号和名称', 'en-US': 'Number and Name', 'ja-JP': '番号と名称' },
    Name: { 'zh-CN': '仅名称', 'en-US': 'Name Only', 'ja-JP': '名称のみ' },
    Id: { 'zh-CN': '仅编号', 'en-US': 'Number Only', 'ja-JP': '番号のみ' },
  },
  'roll_call.display_style': {
    Default: { 'zh-CN': '默认', 'en-US': 'Default', 'ja-JP': '既定' },
    Card: { 'zh-CN': '卡片', 'en-US': 'Card', 'ja-JP': 'カード' },
  },
  'roll_call.animation': {
    ManualStop: { 'zh-CN': '手动停止', 'en-US': 'Manual Stop', 'ja-JP': '手動停止' },
    AutoPlay: { 'zh-CN': '自动播放', 'en-US': 'Autoplay', 'ja-JP': '自動再生' },
    NoAnimation: { 'zh-CN': '无动画', 'en-US': 'No Animation', 'ja-JP': 'アニメーションなし' },
  },
  'roll_call.animation_style': {
    DirectRotate: { 'zh-CN': '直接轮换', 'en-US': 'Direct Rotation', 'ja-JP': '直接切り替え' },
    FadeFloat: { 'zh-CN': '淡入上浮', 'en-US': 'Fade and Float Up', 'ja-JP': 'フェードして上昇' },
    HorizontalShake: { 'zh-CN': '左右晃动', 'en-US': 'Horizontal Shake', 'ja-JP': '左右に揺らす' },
  },
  'roll_call.animation_color_theme': {
    None: { 'zh-CN': '无', 'en-US': 'None', 'ja-JP': 'なし' },
    Random: { 'zh-CN': '随机', 'en-US': 'Random', 'ja-JP': 'ランダム' },
    Fixed: { 'zh-CN': '固定颜色', 'en-US': 'Fixed Color', 'ja-JP': '固定色' },
  },
  'roll_call.student_image_position': {
    Left: { 'zh-CN': '左侧', 'en-US': 'Left', 'ja-JP': '左' },
    Top: { 'zh-CN': '上方', 'en-US': 'Top', 'ja-JP': '上' },
    Right: { 'zh-CN': '右侧', 'en-US': 'Right', 'ja-JP': '右' },
    Bottom: { 'zh-CN': '下方', 'en-US': 'Bottom', 'ja-JP': '下' },
  },

  
  'quick_draw.draw_mode': {
    Repeat: { 'zh-CN': '允许重复', 'en-US': 'Allow Repeats', 'ja-JP': '重複を許可' },
    NoRepeat: { 'zh-CN': '不重复', 'en-US': 'No Repeats', 'ja-JP': '重複なし' },
    HalfRepeat: { 'zh-CN': '半重复', 'en-US': 'Half Repeat', 'ja-JP': '半重複' },
  },
  'quick_draw.use_global_font': {
    FollowGlobal: { 'zh-CN': '跟随全局', 'en-US': 'Follow Global', 'ja-JP': '全体設定に従う' },
    Custom: { 'zh-CN': '自定义', 'en-US': 'Custom', 'ja-JP': 'カスタム' },
  },
  'quick_draw.display_format': {
    Both: { 'zh-CN': '编号和名称', 'en-US': 'Number and Name', 'ja-JP': '番号と名称' },
    Name: { 'zh-CN': '仅名称', 'en-US': 'Name Only', 'ja-JP': '名称のみ' },
    Id: { 'zh-CN': '仅编号', 'en-US': 'Number Only', 'ja-JP': '番号のみ' },
  },
  'quick_draw.animation': {
    ManualStop: { 'zh-CN': '手动停止', 'en-US': 'Manual Stop', 'ja-JP': '手動停止' },
    AutoPlay: { 'zh-CN': '自动播放', 'en-US': 'Autoplay', 'ja-JP': '自動再生' },
    NoAnimation: { 'zh-CN': '无动画', 'en-US': 'No Animation', 'ja-JP': 'アニメーションなし' },
  },
  'quick_draw.animation_style': {
    DirectRotate: { 'zh-CN': '直接轮换', 'en-US': 'Direct Rotation', 'ja-JP': '直接切り替え' },
    FadeFloat: { 'zh-CN': '淡入上浮', 'en-US': 'Fade and Float Up', 'ja-JP': 'フェードして上昇' },
    HorizontalShake: { 'zh-CN': '左右晃动', 'en-US': 'Horizontal Shake', 'ja-JP': '左右に揺らす' },
  },
  'quick_draw.animation_color_theme': {
    None: { 'zh-CN': '无', 'en-US': 'None', 'ja-JP': 'なし' },
    Random: { 'zh-CN': '随机', 'en-US': 'Random', 'ja-JP': 'ランダム' },
    Fixed: { 'zh-CN': '固定颜色', 'en-US': 'Fixed Color', 'ja-JP': '固定色' },
  },
  'quick_draw.student_image_position': {
    Left: { 'zh-CN': '左侧', 'en-US': 'Left', 'ja-JP': '左' },
    Top: { 'zh-CN': '上方', 'en-US': 'Top', 'ja-JP': '上' },
    Right: { 'zh-CN': '右侧', 'en-US': 'Right', 'ja-JP': '右' },
    Bottom: { 'zh-CN': '下方', 'en-US': 'Bottom', 'ja-JP': '下' },
  },

  
  'lottery.draw_mode': {
    Repeat: { 'zh-CN': '允许重复', 'en-US': 'Allow Repeats', 'ja-JP': '重複を許可' },
    NoRepeat: { 'zh-CN': '不重复', 'en-US': 'No Repeats', 'ja-JP': '重複なし' },
    HalfRepeat: { 'zh-CN': '半重复', 'en-US': 'Half Repeat', 'ja-JP': '半重複' },
  },
  'lottery.clear_record': {
    Restarted: { 'zh-CN': '重启后清除', 'en-US': 'Clear on Restart', 'ja-JP': '再起動後に消去' },
    Cleared: { 'zh-CN': '手动清除', 'en-US': 'Clear Manually', 'ja-JP': '手動で消去' },
  },
  'lottery.use_global_font': {
    FollowGlobal: { 'zh-CN': '跟随全局', 'en-US': 'Follow Global', 'ja-JP': '全体設定に従う' },
    Custom: { 'zh-CN': '自定义', 'en-US': 'Custom', 'ja-JP': 'カスタム' },
  },
  'lottery.display_style': {
    Default: { 'zh-CN': '默认', 'en-US': 'Default', 'ja-JP': '既定' },
    Card: { 'zh-CN': '卡片', 'en-US': 'Card', 'ja-JP': 'カード' },
  },
  
  
  
  
  
  
  
  
  'lottery.lottery_show_random': {
    PrizeIdPrizeBreakGroupHyphenMember: { 'zh-CN': '序号 奖品/分组-名称' },
    PrizeBreakGroupHyphenMember: {
      'zh-CN': '奖品/分组-名称',
      'en-US': 'Prize/Group-Name',
      
      'ja-JP': '景品/分組-名称',
    },
    PrizeHyphenMember: { 'zh-CN': '奖品-名称', 'en-US': 'Prize-Name', 'ja-JP': '景品-名称' },
    PrizeHyphenGroup: { 'zh-CN': '奖品-分组', 'en-US': 'Prize-Group', 'ja-JP': '景品-分組' },
    Custom: { 'zh-CN': '自定义', 'en-US': 'Custom', 'ja-JP': 'カスタム' },
  },
  'lottery.animation': {
    ManualStop: { 'zh-CN': '手动停止', 'en-US': 'Manual Stop', 'ja-JP': '手動停止' },
    AutoPlay: { 'zh-CN': '自动播放', 'en-US': 'Autoplay', 'ja-JP': '自動再生' },
    NoAnimation: { 'zh-CN': '无动画', 'en-US': 'No Animation', 'ja-JP': 'アニメーションなし' },
  },
  'lottery.animation_style': {
    DirectRotate: { 'zh-CN': '直接轮换', 'en-US': 'Direct Rotation', 'ja-JP': '直接切り替え' },
    FadeFloat: { 'zh-CN': '淡入上浮', 'en-US': 'Fade and Float Up', 'ja-JP': 'フェードして上昇' },
    HorizontalShake: { 'zh-CN': '左右晃动', 'en-US': 'Horizontal Shake', 'ja-JP': '左右に揺らす' },
  },
  'lottery.animation_color_theme': {
    None: { 'zh-CN': '无', 'en-US': 'None', 'ja-JP': 'なし' },
    Random: { 'zh-CN': '随机', 'en-US': 'Random', 'ja-JP': 'ランダム' },
    Fixed: { 'zh-CN': '固定颜色', 'en-US': 'Fixed Color', 'ja-JP': '固定色' },
  },
  'lottery.lottery_image_position': {
    Left: { 'zh-CN': '左侧', 'en-US': 'Left', 'ja-JP': '左' },
    Top: { 'zh-CN': '上方', 'en-US': 'Top', 'ja-JP': '上' },
    Right: { 'zh-CN': '右侧', 'en-US': 'Right', 'ja-JP': '右' },
    Bottom: { 'zh-CN': '下方', 'en-US': 'Bottom', 'ja-JP': '下' },
  },

  
  
  






  'voice.voice_engine': {
    '0': { 'zh-CN': '系统语音', 'en-US': 'System speech', 'ja-JP': 'システム音声' },
    '1': { 'zh-CN': 'Edge TTS', 'en-US': 'Edge TTS', 'ja-JP': 'Edge TTS' },
    '2': { 'zh-CN': 'Omni TTS', 'en-US': 'Omni TTS', 'ja-JP': 'Omni TTS' },
  },
  'voice.omni_tts_provider': {
    OpenAi: { 'zh-CN': 'OpenAI', 'en-US': 'OpenAI', 'ja-JP': 'OpenAI' },
    FishAudio: { 'zh-CN': 'FishAudio', 'en-US': 'FishAudio', 'ja-JP': 'FishAudio' },
    MiMo: { 'zh-CN': 'MiMo', 'en-US': 'MiMo', 'ja-JP': 'MiMo' },
    Gemini: { 'zh-CN': 'Gemini', 'en-US': 'Gemini', 'ja-JP': 'Gemini' },
    Custom: {
      'zh-CN': '自定义（OpenAI 兼容）',
      'en-US': 'Custom (OpenAI Compatible)',
      'ja-JP': 'カスタム（OpenAI 互換）',
    },
  },

  
  
  'appearance.theme': {
    Light: { 'zh-CN': '浅色', 'en-US': 'Light', 'ja-JP': 'ライト' },
    Dark: { 'zh-CN': '深色', 'en-US': 'Dark', 'ja-JP': 'ダーク' },
    Auto: { 'zh-CN': '跟随系统', 'en-US': 'Follow system', 'ja-JP': 'システムに従う' },
  },
  'appearance.theme_color_mode': {
    System: { 'zh-CN': '跟随系统', 'en-US': 'Follow system', 'ja-JP': 'システムに従う' },
    Custom: { 'zh-CN': '自定义', 'en-US': 'Custom', 'ja-JP': 'カスタム' },
  },
  'appearance.font_weight': {
    Thin: { 'zh-CN': '极细', 'en-US': 'Thin', 'ja-JP': '極細' },
    ExtraLight: { 'zh-CN': '特细', 'en-US': 'Extra Light', 'ja-JP': '特細' },
    Light: { 'zh-CN': '细体', 'en-US': 'Light', 'ja-JP': '細字' },
    Regular: { 'zh-CN': '常规', 'en-US': 'Regular', 'ja-JP': '標準' },
    Medium: { 'zh-CN': '中等', 'en-US': 'Medium', 'ja-JP': '中' },
    SemiBold: { 'zh-CN': '半粗', 'en-US': 'Semi Bold', 'ja-JP': 'やや太字' },
    Bold: { 'zh-CN': '粗体', 'en-US': 'Bold', 'ja-JP': '太字' },
    ExtraBold: { 'zh-CN': '特粗', 'en-US': 'Extra Bold', 'ja-JP': '特太' },
    Black: { 'zh-CN': '极粗', 'en-US': 'Black', 'ja-JP': '極太' },
  },
  'floating_window.floating_window_topmost_mode': {
    None: { 'zh-CN': '不置顶', 'en-US': 'Not topmost', 'ja-JP': '最前面にしない' },
    Topmost: { 'zh-CN': '置顶', 'en-US': 'Topmost', 'ja-JP': '最前面' },
    UiAccess: { 'zh-CN': 'UIAccess 置顶', 'en-US': 'UIAccess topmost', 'ja-JP': 'UIAccess 最前面' },
  },
  




  'floating_window.floating_window_placement': {
    '0': { 'zh-CN': '矩形', 'en-US': 'Rectangle', 'ja-JP': '矩形' },
    '1': { 'zh-CN': '纵向', 'en-US': 'Vertical', 'ja-JP': '縦' },
    '2': { 'zh-CN': '横向', 'en-US': 'Horizontal', 'ja-JP': '横' },
  },
  'floating_window.floating_window_display_style': {
    '0': { 'zh-CN': '图标和文字', 'en-US': 'Icon and text', 'ja-JP': 'アイコンと文字' },
    '1': { 'zh-CN': '仅图标', 'en-US': 'Icon only', 'ja-JP': 'アイコンのみ' },
    '2': { 'zh-CN': '仅文字', 'en-US': 'Text only', 'ja-JP': '文字のみ' },
  },
  'floating_window.stick_to_edge_display_style': {
    '0': { 'zh-CN': '图标', 'en-US': 'Icon', 'ja-JP': 'アイコン' },
    '1': { 'zh-CN': '文字', 'en-US': 'Text', 'ja-JP': '文字' },
    '2': { 'zh-CN': '箭头', 'en-US': 'Arrow', 'ja-JP': '矢印' },
  },
  'linkage.data_source': {
    Off: { 'zh-CN': '关闭', 'en-US': 'Off', 'ja-JP': 'オフ' },
    Cses: { 'zh-CN': 'CSES 课程表', 'en-US': 'CSES timetable', 'ja-JP': 'CSES 時間割' },
    ClassIsland: { 'zh-CN': 'ClassIsland', 'en-US': 'ClassIsland', 'ja-JP': 'ClassIsland' },
  },
  'linkage.subject_history_break_assignment': {
    Break: { 'zh-CN': '课间', 'en-US': 'Break', 'ja-JP': '休み時間' },
    PreviousClass: { 'zh-CN': '上节课', 'en-US': 'Previous class', 'ja-JP': '前の授業' },
    NextClass: { 'zh-CN': '下节课', 'en-US': 'Next class', 'ja-JP': '次の授業' },
  },

  
  
  
  'more.roll_call_control_panel_position': {
    Right: { 'zh-CN': '右侧', 'en-US': 'Right', 'ja-JP': '右' },
    Left: { 'zh-CN': '左侧', 'en-US': 'Left', 'ja-JP': '左' },
  },
  'more.lottery_control_panel_position': {
    Right: { 'zh-CN': '右侧', 'en-US': 'Right', 'ja-JP': '右' },
    Left: { 'zh-CN': '左侧', 'en-US': 'Left', 'ja-JP': '左' },
  },
}










export const CLIENT_SETTING_OPTION_LABELS_SOURCE: Readonly<Record<string, OptionLabelSource>> = {
  
  
  
  'default_draw.draw_mode': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/DefaultDrawSettingsPage.axaml',
      anchor: 'S_DrawMode',
      property: 'DrawMode',
    },
    entries: [
      { member: 'Repeat', resourceKey: { 'zh-CN': 'O_Repeat', 'en-US': 'O_Repeat', 'ja-JP': 'O_Repeat' } },
      {
        member: 'NoRepeat',
        resourceKey: { 'zh-CN': 'O_NoRepeat', 'en-US': 'O_NoRepeat', 'ja-JP': 'O_NoRepeat' },
      },
      {
        member: 'HalfRepeat',
        resourceKey: { 'zh-CN': 'O_HalfRepeat', 'en-US': 'O_HalfRepeat', 'ja-JP': 'O_HalfRepeat' },
      },
    ],
  },
  'default_draw.use_global_font': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/DefaultDrawSettingsPage.axaml',
      anchor: 'S_FontSource',
      property: 'UseGlobalFont',
    },
    entries: [
      {
        member: 'FollowGlobal',
        resourceKey: { 'zh-CN': 'O_FollowGlobal', 'en-US': 'O_FollowGlobal', 'ja-JP': 'O_FollowGlobal' },
      },
      { member: 'Custom', resourceKey: { 'zh-CN': 'O_Custom', 'en-US': 'O_Custom', 'ja-JP': 'O_Custom' } },
    ],
  },
  'default_draw.display_style': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/DefaultDrawSettingsPage.axaml',
      anchor: 'S_DisplayStyle',
      property: 'DisplayStyle',
    },
    entries: [
      { member: 'Default', resourceKey: { 'zh-CN': 'O_Default', 'en-US': 'O_Default', 'ja-JP': 'O_Default' } },
      { member: 'Card', resourceKey: { 'zh-CN': 'O_Card', 'en-US': 'O_Card', 'ja-JP': 'O_Card' } },
    ],
  },
  'default_draw.display_format': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/DefaultDrawSettingsPage.axaml',
      anchor: 'S_DisplayFormat',
      property: 'DisplayFormat',
    },
    entries: [
      { member: 'Both', resourceKey: { 'zh-CN': 'O_Both', 'en-US': 'O_Both', 'ja-JP': 'O_Both' } },
      { member: 'Name', resourceKey: { 'zh-CN': 'O_Name', 'en-US': 'O_Name', 'ja-JP': 'O_Name' } },
      { member: 'Id', resourceKey: { 'zh-CN': 'O_Id', 'en-US': 'O_Id', 'ja-JP': 'O_Id' } },
    ],
  },
  'default_draw.animation': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/DefaultDrawSettingsPage.axaml',
      anchor: 'S_Animation',
      property: 'Animation',
    },
    entries: [
      {
        member: 'ManualStop',
        resourceKey: { 'zh-CN': 'O_ManualStop', 'en-US': 'O_ManualStop', 'ja-JP': 'O_ManualStop' },
      },
      { member: 'AutoPlay', resourceKey: { 'zh-CN': 'O_AutoPlay', 'en-US': 'O_AutoPlay', 'ja-JP': 'O_AutoPlay' } },
      {
        member: 'NoAnimation',
        resourceKey: { 'zh-CN': 'O_NoAnimation', 'en-US': 'O_NoAnimation', 'ja-JP': 'O_NoAnimation' },
      },
    ],
  },
  'default_draw.animation_style': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/DefaultDrawSettingsPage.axaml',
      anchor: 'S_AnimationStyle',
      property: 'AnimationStyle',
    },
    entries: [
      {
        member: 'DirectRotate',
        resourceKey: {
          'zh-CN': 'O_AnimationDirectRotate',
          'en-US': 'O_AnimationDirectRotate',
          'ja-JP': 'O_AnimationDirectRotate',
        },
      },
      {
        member: 'FadeFloat',
        resourceKey: {
          'zh-CN': 'O_AnimationFadeFloat',
          'en-US': 'O_AnimationFadeFloat',
          'ja-JP': 'O_AnimationFadeFloat',
        },
      },
      {
        member: 'HorizontalShake',
        resourceKey: {
          'zh-CN': 'O_AnimationHorizontalShake',
          'en-US': 'O_AnimationHorizontalShake',
          'ja-JP': 'O_AnimationHorizontalShake',
        },
      },
    ],
  },
  'default_draw.animation_color_theme': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/DefaultDrawSettingsPage.axaml',
      anchor: 'S_ColorTheme',
      property: 'AnimationColorTheme',
    },
    entries: [
      { member: 'None', resourceKey: { 'zh-CN': 'O_NoColor', 'en-US': 'O_NoColor', 'ja-JP': 'O_NoColor' } },
      {
        member: 'Random',
        resourceKey: { 'zh-CN': 'O_RandomColor', 'en-US': 'O_RandomColor', 'ja-JP': 'O_RandomColor' },
      },
      { member: 'Fixed', resourceKey: { 'zh-CN': 'O_FixedColor', 'en-US': 'O_FixedColor', 'ja-JP': 'O_FixedColor' } },
    ],
  },
  'default_draw.student_image_position': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/DefaultDrawSettingsPage.axaml',
      anchor: 'S_StudentImagePosition',
      property: 'StudentImagePosition',
    },
    entries: [
      { member: 'Left', resourceKey: { 'zh-CN': 'O_Left', 'en-US': 'O_Left', 'ja-JP': 'O_Left' } },
      { member: 'Top', resourceKey: { 'zh-CN': 'O_Top', 'en-US': 'O_Top', 'ja-JP': 'O_Top' } },
      { member: 'Right', resourceKey: { 'zh-CN': 'O_Right', 'en-US': 'O_Right', 'ja-JP': 'O_Right' } },
      { member: 'Bottom', resourceKey: { 'zh-CN': 'O_Bottom', 'en-US': 'O_Bottom', 'ja-JP': 'O_Bottom' } },
    ],
  },

  'roll_call.draw_mode': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/RollCallDrawSettingsPage.axaml',
      anchor: 'S_DrawMode',
      property: 'DrawMode',
    },
    entries: [
      { member: 'Repeat', resourceKey: { 'zh-CN': 'O_Repeat', 'en-US': 'O_Repeat', 'ja-JP': 'O_Repeat' } },
      {
        member: 'NoRepeat',
        resourceKey: { 'zh-CN': 'O_NoRepeat', 'en-US': 'O_NoRepeat', 'ja-JP': 'O_NoRepeat' },
      },
      {
        member: 'HalfRepeat',
        resourceKey: { 'zh-CN': 'O_HalfRepeat', 'en-US': 'O_HalfRepeat', 'ja-JP': 'O_HalfRepeat' },
      },
    ],
  },
  'roll_call.clear_record': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/RollCallDrawSettingsPage.axaml',
      anchor: 'S_ClearRecord',
      property: 'ClearRecord',
    },
    entries: [
      {
        member: 'Restarted',
        resourceKey: { 'zh-CN': 'O_Restarted', 'en-US': 'O_Restarted', 'ja-JP': 'O_Restarted' },
      },
      { member: 'Cleared', resourceKey: { 'zh-CN': 'O_Cleared', 'en-US': 'O_Cleared', 'ja-JP': 'O_Cleared' } },
    ],
  },
  'roll_call.use_global_font': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/RollCallDrawSettingsPage.axaml',
      anchor: 'S_FontSource',
      property: 'UseGlobalFont',
    },
    entries: [
      {
        member: 'FollowGlobal',
        resourceKey: { 'zh-CN': 'O_FollowGlobal', 'en-US': 'O_FollowGlobal', 'ja-JP': 'O_FollowGlobal' },
      },
      { member: 'Custom', resourceKey: { 'zh-CN': 'O_Custom', 'en-US': 'O_Custom', 'ja-JP': 'O_Custom' } },
    ],
  },
  'roll_call.display_format': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/RollCallDrawSettingsPage.axaml',
      anchor: 'S_DisplayFormat',
      property: 'DisplayFormat',
    },
    entries: [
      { member: 'Both', resourceKey: { 'zh-CN': 'O_Both', 'en-US': 'O_Both', 'ja-JP': 'O_Both' } },
      { member: 'Name', resourceKey: { 'zh-CN': 'O_Name', 'en-US': 'O_Name', 'ja-JP': 'O_Name' } },
      { member: 'Id', resourceKey: { 'zh-CN': 'O_Id', 'en-US': 'O_Id', 'ja-JP': 'O_Id' } },
    ],
  },
  'roll_call.display_style': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/RollCallDrawSettingsPage.axaml',
      anchor: 'S_DisplayStyle',
      property: 'DisplayStyle',
    },
    entries: [
      { member: 'Default', resourceKey: { 'zh-CN': 'O_Default', 'en-US': 'O_Default', 'ja-JP': 'O_Default' } },
      { member: 'Card', resourceKey: { 'zh-CN': 'O_Card', 'en-US': 'O_Card', 'ja-JP': 'O_Card' } },
    ],
  },
  'roll_call.animation': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/RollCallDrawSettingsPage.axaml',
      anchor: 'S_Animation',
      property: 'Animation',
    },
    entries: [
      {
        member: 'ManualStop',
        resourceKey: { 'zh-CN': 'O_ManualStop', 'en-US': 'O_ManualStop', 'ja-JP': 'O_ManualStop' },
      },
      { member: 'AutoPlay', resourceKey: { 'zh-CN': 'O_AutoPlay', 'en-US': 'O_AutoPlay', 'ja-JP': 'O_AutoPlay' } },
      {
        member: 'NoAnimation',
        resourceKey: { 'zh-CN': 'O_NoAnimation', 'en-US': 'O_NoAnimation', 'ja-JP': 'O_NoAnimation' },
      },
    ],
  },
  'roll_call.animation_style': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/RollCallDrawSettingsPage.axaml',
      anchor: 'S_AnimationStyle',
      property: 'AnimationStyle',
    },
    entries: [
      {
        member: 'DirectRotate',
        resourceKey: {
          'zh-CN': 'O_AnimationDirectRotate',
          'en-US': 'O_AnimationDirectRotate',
          'ja-JP': 'O_AnimationDirectRotate',
        },
      },
      {
        member: 'FadeFloat',
        resourceKey: {
          'zh-CN': 'O_AnimationFadeFloat',
          'en-US': 'O_AnimationFadeFloat',
          'ja-JP': 'O_AnimationFadeFloat',
        },
      },
      {
        member: 'HorizontalShake',
        resourceKey: {
          'zh-CN': 'O_AnimationHorizontalShake',
          'en-US': 'O_AnimationHorizontalShake',
          'ja-JP': 'O_AnimationHorizontalShake',
        },
      },
    ],
  },
  'roll_call.animation_color_theme': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/RollCallDrawSettingsPage.axaml',
      anchor: 'S_ColorTheme',
      property: 'AnimationColorTheme',
    },
    entries: [
      { member: 'None', resourceKey: { 'zh-CN': 'O_NoColor', 'en-US': 'O_NoColor', 'ja-JP': 'O_NoColor' } },
      {
        member: 'Random',
        resourceKey: { 'zh-CN': 'O_RandomColor', 'en-US': 'O_RandomColor', 'ja-JP': 'O_RandomColor' },
      },
      { member: 'Fixed', resourceKey: { 'zh-CN': 'O_FixedColor', 'en-US': 'O_FixedColor', 'ja-JP': 'O_FixedColor' } },
    ],
  },
  'roll_call.student_image_position': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/RollCallDrawSettingsPage.axaml',
      anchor: 'S_StudentImagePosition',
      property: 'StudentImagePosition',
    },
    entries: [
      { member: 'Left', resourceKey: { 'zh-CN': 'O_Left', 'en-US': 'O_Left', 'ja-JP': 'O_Left' } },
      { member: 'Top', resourceKey: { 'zh-CN': 'O_Top', 'en-US': 'O_Top', 'ja-JP': 'O_Top' } },
      { member: 'Right', resourceKey: { 'zh-CN': 'O_Right', 'en-US': 'O_Right', 'ja-JP': 'O_Right' } },
      { member: 'Bottom', resourceKey: { 'zh-CN': 'O_Bottom', 'en-US': 'O_Bottom', 'ja-JP': 'O_Bottom' } },
    ],
  },

  'quick_draw.draw_mode': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/QuickDrawSettingsPage.axaml',
      anchor: 'S_DrawMode',
      property: 'DrawMode',
    },
    entries: [
      { member: 'Repeat', resourceKey: { 'zh-CN': 'O_Repeat', 'en-US': 'O_Repeat', 'ja-JP': 'O_Repeat' } },
      {
        member: 'NoRepeat',
        resourceKey: { 'zh-CN': 'O_NoRepeat', 'en-US': 'O_NoRepeat', 'ja-JP': 'O_NoRepeat' },
      },
      {
        member: 'HalfRepeat',
        resourceKey: { 'zh-CN': 'O_HalfRepeat', 'en-US': 'O_HalfRepeat', 'ja-JP': 'O_HalfRepeat' },
      },
    ],
  },
  'quick_draw.use_global_font': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/QuickDrawSettingsPage.axaml',
      anchor: 'S_FontSource',
      property: 'UseGlobalFont',
    },
    entries: [
      {
        member: 'FollowGlobal',
        resourceKey: { 'zh-CN': 'O_FollowGlobal', 'en-US': 'O_FollowGlobal', 'ja-JP': 'O_FollowGlobal' },
      },
      { member: 'Custom', resourceKey: { 'zh-CN': 'O_Custom', 'en-US': 'O_Custom', 'ja-JP': 'O_Custom' } },
    ],
  },
  'quick_draw.display_format': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/QuickDrawSettingsPage.axaml',
      anchor: 'S_DisplayFormat',
      property: 'DisplayFormat',
    },
    entries: [
      { member: 'Both', resourceKey: { 'zh-CN': 'O_Both', 'en-US': 'O_Both', 'ja-JP': 'O_Both' } },
      { member: 'Name', resourceKey: { 'zh-CN': 'O_Name', 'en-US': 'O_Name', 'ja-JP': 'O_Name' } },
      { member: 'Id', resourceKey: { 'zh-CN': 'O_Id', 'en-US': 'O_Id', 'ja-JP': 'O_Id' } },
    ],
  },
  'quick_draw.animation': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/QuickDrawSettingsPage.axaml',
      anchor: 'S_Animation',
      property: 'Animation',
    },
    entries: [
      {
        member: 'ManualStop',
        resourceKey: { 'zh-CN': 'O_ManualStop', 'en-US': 'O_ManualStop', 'ja-JP': 'O_ManualStop' },
      },
      { member: 'AutoPlay', resourceKey: { 'zh-CN': 'O_AutoPlay', 'en-US': 'O_AutoPlay', 'ja-JP': 'O_AutoPlay' } },
      {
        member: 'NoAnimation',
        resourceKey: { 'zh-CN': 'O_NoAnimation', 'en-US': 'O_NoAnimation', 'ja-JP': 'O_NoAnimation' },
      },
    ],
  },
  'quick_draw.animation_style': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/QuickDrawSettingsPage.axaml',
      anchor: 'S_AnimationStyle',
      property: 'AnimationStyle',
    },
    entries: [
      {
        member: 'DirectRotate',
        resourceKey: {
          'zh-CN': 'O_AnimationDirectRotate',
          'en-US': 'O_AnimationDirectRotate',
          'ja-JP': 'O_AnimationDirectRotate',
        },
      },
      {
        member: 'FadeFloat',
        resourceKey: {
          'zh-CN': 'O_AnimationFadeFloat',
          'en-US': 'O_AnimationFadeFloat',
          'ja-JP': 'O_AnimationFadeFloat',
        },
      },
      {
        member: 'HorizontalShake',
        resourceKey: {
          'zh-CN': 'O_AnimationHorizontalShake',
          'en-US': 'O_AnimationHorizontalShake',
          'ja-JP': 'O_AnimationHorizontalShake',
        },
      },
    ],
  },
  'quick_draw.animation_color_theme': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/QuickDrawSettingsPage.axaml',
      anchor: 'S_ColorTheme',
      property: 'AnimationColorTheme',
    },
    entries: [
      { member: 'None', resourceKey: { 'zh-CN': 'O_NoColor', 'en-US': 'O_NoColor', 'ja-JP': 'O_NoColor' } },
      {
        member: 'Random',
        resourceKey: { 'zh-CN': 'O_RandomColor', 'en-US': 'O_RandomColor', 'ja-JP': 'O_RandomColor' },
      },
      { member: 'Fixed', resourceKey: { 'zh-CN': 'O_FixedColor', 'en-US': 'O_FixedColor', 'ja-JP': 'O_FixedColor' } },
    ],
  },
  'quick_draw.student_image_position': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/QuickDrawSettingsPage.axaml',
      anchor: 'S_StudentImagePosition',
      property: 'StudentImagePosition',
    },
    entries: [
      { member: 'Left', resourceKey: { 'zh-CN': 'O_Left', 'en-US': 'O_Left', 'ja-JP': 'O_Left' } },
      { member: 'Top', resourceKey: { 'zh-CN': 'O_Top', 'en-US': 'O_Top', 'ja-JP': 'O_Top' } },
      { member: 'Right', resourceKey: { 'zh-CN': 'O_Right', 'en-US': 'O_Right', 'ja-JP': 'O_Right' } },
      { member: 'Bottom', resourceKey: { 'zh-CN': 'O_Bottom', 'en-US': 'O_Bottom', 'ja-JP': 'O_Bottom' } },
    ],
  },

  'lottery.draw_mode': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/LotteryDrawSettingsPage.axaml',
      anchor: 'S_DrawMode',
      property: 'DrawMode',
    },
    entries: [
      { member: 'Repeat', resourceKey: { 'zh-CN': 'O_Repeat', 'en-US': 'O_Repeat', 'ja-JP': 'O_Repeat' } },
      {
        member: 'NoRepeat',
        resourceKey: { 'zh-CN': 'O_NoRepeat', 'en-US': 'O_NoRepeat', 'ja-JP': 'O_NoRepeat' },
      },
      {
        member: 'HalfRepeat',
        resourceKey: { 'zh-CN': 'O_HalfRepeat', 'en-US': 'O_HalfRepeat', 'ja-JP': 'O_HalfRepeat' },
      },
    ],
  },
  'lottery.clear_record': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/LotteryDrawSettingsPage.axaml',
      anchor: 'S_ClearRecord',
      property: 'ClearRecord',
    },
    entries: [
      {
        member: 'Restarted',
        resourceKey: { 'zh-CN': 'O_Restarted', 'en-US': 'O_Restarted', 'ja-JP': 'O_Restarted' },
      },
      { member: 'Cleared', resourceKey: { 'zh-CN': 'O_Cleared', 'en-US': 'O_Cleared', 'ja-JP': 'O_Cleared' } },
    ],
  },
  'lottery.use_global_font': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/LotteryDrawSettingsPage.axaml',
      anchor: 'S_FontSource',
      property: 'UseGlobalFont',
    },
    entries: [
      {
        member: 'FollowGlobal',
        resourceKey: { 'zh-CN': 'O_FollowGlobal', 'en-US': 'O_FollowGlobal', 'ja-JP': 'O_FollowGlobal' },
      },
      { member: 'Custom', resourceKey: { 'zh-CN': 'O_Custom', 'en-US': 'O_Custom', 'ja-JP': 'O_Custom' } },
    ],
  },
  'lottery.display_style': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/LotteryDrawSettingsPage.axaml',
      anchor: 'S_DisplayStyle',
      property: 'DisplayStyle',
    },
    entries: [
      { member: 'Default', resourceKey: { 'zh-CN': 'O_Default', 'en-US': 'O_Default', 'ja-JP': 'O_Default' } },
      { member: 'Card', resourceKey: { 'zh-CN': 'O_Card', 'en-US': 'O_Card', 'ja-JP': 'O_Card' } },
    ],
  },
  'lottery.lottery_show_random': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/LotteryDrawSettingsPage.axaml',
      anchor: 'S_LotteryShowRandom',
      property: 'LotteryShowRandom',
    },
    entries: [
      
      
      {
        member: 'PrizeIdPrizeBreakGroupHyphenMember',
        resourceKey: { 'zh-CN': 'O_PrizeIdPrizeBreakGroupHyphenMember' },
      },
      {
        member: 'PrizeBreakGroupHyphenMember',
        resourceKey: {
          'zh-CN': 'O_PrizeBreakGroupHyphenName',
          'en-US': 'O_PrizeBreakGroupHyphenName',
          'ja-JP': 'O_PrizeBreakGroupHyphenName',
        },
      },
      {
        member: 'PrizeHyphenMember',
        resourceKey: {
          'zh-CN': 'O_PrizeHyphenName',
          'en-US': 'O_PrizeHyphenName',
          'ja-JP': 'O_PrizeHyphenName',
        },
      },
      {
        member: 'PrizeHyphenGroup',
        resourceKey: {
          'zh-CN': 'O_PrizeHyphenGroup',
          'en-US': 'O_PrizeHyphenGroup',
          'ja-JP': 'O_PrizeHyphenGroup',
        },
      },
      {
        member: 'Custom',
        resourceKey: { 'zh-CN': 'O_Custom', 'en-US': 'O_Custom', 'ja-JP': 'O_Custom' },
      },
    ],
  },
  'lottery.animation': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/LotteryDrawSettingsPage.axaml',
      anchor: 'S_Animation',
      property: 'Animation',
    },
    entries: [
      {
        member: 'ManualStop',
        resourceKey: { 'zh-CN': 'O_ManualStop', 'en-US': 'O_ManualStop', 'ja-JP': 'O_ManualStop' },
      },
      { member: 'AutoPlay', resourceKey: { 'zh-CN': 'O_AutoPlay', 'en-US': 'O_AutoPlay', 'ja-JP': 'O_AutoPlay' } },
      {
        member: 'NoAnimation',
        resourceKey: { 'zh-CN': 'O_NoAnimation', 'en-US': 'O_NoAnimation', 'ja-JP': 'O_NoAnimation' },
      },
    ],
  },
  'lottery.animation_style': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/LotteryDrawSettingsPage.axaml',
      anchor: 'S_AnimationStyle',
      property: 'AnimationStyle',
    },
    entries: [
      {
        member: 'DirectRotate',
        resourceKey: {
          'zh-CN': 'O_AnimationDirectRotate',
          'en-US': 'O_AnimationDirectRotate',
          'ja-JP': 'O_AnimationDirectRotate',
        },
      },
      {
        member: 'FadeFloat',
        resourceKey: {
          'zh-CN': 'O_AnimationFadeFloat',
          'en-US': 'O_AnimationFadeFloat',
          'ja-JP': 'O_AnimationFadeFloat',
        },
      },
      {
        member: 'HorizontalShake',
        resourceKey: {
          'zh-CN': 'O_AnimationHorizontalShake',
          'en-US': 'O_AnimationHorizontalShake',
          'ja-JP': 'O_AnimationHorizontalShake',
        },
      },
    ],
  },
  'lottery.animation_color_theme': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/LotteryDrawSettingsPage.axaml',
      anchor: 'S_ColorTheme',
      property: 'AnimationColorTheme',
    },
    entries: [
      { member: 'None', resourceKey: { 'zh-CN': 'O_NoColor', 'en-US': 'O_NoColor', 'ja-JP': 'O_NoColor' } },
      {
        member: 'Random',
        resourceKey: { 'zh-CN': 'O_RandomColor', 'en-US': 'O_RandomColor', 'ja-JP': 'O_RandomColor' },
      },
      { member: 'Fixed', resourceKey: { 'zh-CN': 'O_FixedColor', 'en-US': 'O_FixedColor', 'ja-JP': 'O_FixedColor' } },
    ],
  },
  'lottery.lottery_image_position': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Picking',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Picking/LotteryDrawSettingsPage.axaml',
      anchor: 'S_LotteryImagePosition',
      property: 'LotteryImagePosition',
    },
    entries: [
      { member: 'Left', resourceKey: { 'zh-CN': 'O_Left', 'en-US': 'O_Left', 'ja-JP': 'O_Left' } },
      { member: 'Top', resourceKey: { 'zh-CN': 'O_Top', 'en-US': 'O_Top', 'ja-JP': 'O_Top' } },
      { member: 'Right', resourceKey: { 'zh-CN': 'O_Right', 'en-US': 'O_Right', 'ja-JP': 'O_Right' } },
      { member: 'Bottom', resourceKey: { 'zh-CN': 'O_Bottom', 'en-US': 'O_Bottom', 'ja-JP': 'O_Bottom' } },
    ],
  },

  'voice.voice_engine': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Voice',
    
    
    
    xaml: null,
    entries: [
      {
        member: '0',
        resourceKey: {
          'zh-CN': 'O_VoiceEngine_System',
          'en-US': 'O_VoiceEngine_System',
          'ja-JP': 'O_VoiceEngine_System',
        },
      },
      {
        member: '1',
        resourceKey: {
          'zh-CN': 'O_VoiceEngine_EdgeTts',
          'en-US': 'O_VoiceEngine_EdgeTts',
          'ja-JP': 'O_VoiceEngine_EdgeTts',
        },
      },
      {
        member: '2',
        resourceKey: {
          'zh-CN': 'O_VoiceEngine_OmniTts',
          'en-US': 'O_VoiceEngine_OmniTts',
          'ja-JP': 'O_VoiceEngine_OmniTts',
        },
      },
    ],
  },
  'voice.omni_tts_provider': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Voice',
    
    
    xaml: null,
    entries: [
      {
        member: 'OpenAi',
        resourceKey: {
          'zh-CN': 'O_OmniTtsProvider_OpenAi',
          'en-US': 'O_OmniTtsProvider_OpenAi',
          'ja-JP': 'O_OmniTtsProvider_OpenAi',
        },
      },
      {
        member: 'FishAudio',
        resourceKey: {
          'zh-CN': 'O_OmniTtsProvider_FishAudio',
          'en-US': 'O_OmniTtsProvider_FishAudio',
          'ja-JP': 'O_OmniTtsProvider_FishAudio',
        },
      },
      {
        member: 'MiMo',
        resourceKey: {
          'zh-CN': 'O_OmniTtsProvider_MiMo',
          'en-US': 'O_OmniTtsProvider_MiMo',
          'ja-JP': 'O_OmniTtsProvider_MiMo',
        },
      },
      
      { member: 'Gemini', literal: true },
      {
        member: 'Custom',
        resourceKey: {
          'zh-CN': 'O_OmniTtsProvider_Custom',
          'en-US': 'O_OmniTtsProvider_Custom',
          'ja-JP': 'O_OmniTtsProvider_Custom',
        },
      },
    ],
  },

  
  'appearance.theme': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Personalized/Appearance',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Personalized/AppearanceSettingsPage.axaml',
      anchor: 'S_Theme_Theme',
      property: 'Theme',
    },
    entries: [
      { member: 'Light', resourceKey: { 'zh-CN': 'O_Theme_Light', 'en-US': 'O_Theme_Light', 'ja-JP': 'O_Theme_Light' } },
      { member: 'Dark', resourceKey: { 'zh-CN': 'O_Theme_Dark', 'en-US': 'O_Theme_Dark', 'ja-JP': 'O_Theme_Dark' } },
      { member: 'Auto', resourceKey: { 'zh-CN': 'O_Theme_Auto', 'en-US': 'O_Theme_Auto', 'ja-JP': 'O_Theme_Auto' } },
    ],
  },
  'appearance.theme_color_mode': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Personalized/Appearance',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Personalized/AppearanceSettingsPage.axaml',
      anchor: 'S_Theme_ThemeColor',
      property: 'ThemeColorMode',
    },
    entries: [
      { member: 'System', resourceKey: { 'zh-CN': 'O_ThemeColorMode_System', 'en-US': 'O_ThemeColorMode_System', 'ja-JP': 'O_ThemeColorMode_System' } },
      { member: 'Custom', resourceKey: { 'zh-CN': 'O_ThemeColorMode_Custom', 'en-US': 'O_ThemeColorMode_Custom', 'ja-JP': 'O_ThemeColorMode_Custom' } },
    ],
  },
  'appearance.font_weight': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Personalized/Appearance',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Personalized/AppearanceSettingsPage.axaml',
      anchor: 'S_Font_FontWeight',
      property: 'FontWeight',
    },
    entries: [
      { member: 'Thin', resourceKey: { 'zh-CN': 'O_FontWeight_Thin', 'en-US': 'O_FontWeight_Thin', 'ja-JP': 'O_FontWeight_Thin' } },
      { member: 'ExtraLight', resourceKey: { 'zh-CN': 'O_FontWeight_ExtraLight', 'en-US': 'O_FontWeight_ExtraLight', 'ja-JP': 'O_FontWeight_ExtraLight' } },
      { member: 'Light', resourceKey: { 'zh-CN': 'O_FontWeight_Light', 'en-US': 'O_FontWeight_Light', 'ja-JP': 'O_FontWeight_Light' } },
      { member: 'Regular', resourceKey: { 'zh-CN': 'O_FontWeight_Regular', 'en-US': 'O_FontWeight_Regular', 'ja-JP': 'O_FontWeight_Regular' } },
      { member: 'Medium', resourceKey: { 'zh-CN': 'O_FontWeight_Medium', 'en-US': 'O_FontWeight_Medium', 'ja-JP': 'O_FontWeight_Medium' } },
      { member: 'SemiBold', resourceKey: { 'zh-CN': 'O_FontWeight_SemiBold', 'en-US': 'O_FontWeight_SemiBold', 'ja-JP': 'O_FontWeight_SemiBold' } },
      { member: 'Bold', resourceKey: { 'zh-CN': 'O_FontWeight_Bold', 'en-US': 'O_FontWeight_Bold', 'ja-JP': 'O_FontWeight_Bold' } },
      { member: 'ExtraBold', resourceKey: { 'zh-CN': 'O_FontWeight_ExtraBold', 'en-US': 'O_FontWeight_ExtraBold', 'ja-JP': 'O_FontWeight_ExtraBold' } },
      { member: 'Black', resourceKey: { 'zh-CN': 'O_FontWeight_Black', 'en-US': 'O_FontWeight_Black', 'ja-JP': 'O_FontWeight_Black' } },
    ],
  },
  'floating_window.floating_window_topmost_mode': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/FloatingWindow',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Personalized/FloatingWindowSettingsPage.axaml',
      anchor: 'S_Display_TopmostMode',
      property: 'FloatingWindowTopmostMode',
    },
    entries: [
      { member: 'None', resourceKey: { 'zh-CN': 'O_TopmostMode_None', 'en-US': 'O_TopmostMode_None', 'ja-JP': 'O_TopmostMode_None' } },
      { member: 'Topmost', resourceKey: { 'zh-CN': 'O_TopmostMode_Topmost', 'en-US': 'O_TopmostMode_Topmost', 'ja-JP': 'O_TopmostMode_Topmost' } },
      { member: 'UiAccess', resourceKey: { 'zh-CN': 'O_TopmostMode_UIAccess', 'en-US': 'O_TopmostMode_UIAccess', 'ja-JP': 'O_TopmostMode_UIAccess' } },
    ],
  },
  



  'floating_window.floating_window_placement': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/FloatingWindow',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Personalized/FloatingWindowSettingsPage.axaml',
      anchor: 'S_Buttons_Placement',
      property: 'FloatingWindowPlacement',
    },
    entries: [
      { member: '0', resourceKey: { 'zh-CN': 'O_Placement_Rectangle', 'en-US': 'O_Placement_Rectangle', 'ja-JP': 'O_Placement_Rectangle' } },
      { member: '1', resourceKey: { 'zh-CN': 'O_Placement_Vertical', 'en-US': 'O_Placement_Vertical', 'ja-JP': 'O_Placement_Vertical' } },
      { member: '2', resourceKey: { 'zh-CN': 'O_Placement_Horizontal', 'en-US': 'O_Placement_Horizontal', 'ja-JP': 'O_Placement_Horizontal' } },
    ],
  },
  'floating_window.floating_window_display_style': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/FloatingWindow',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Personalized/FloatingWindowSettingsPage.axaml',
      anchor: 'S_Buttons_DisplayStyle',
      property: 'FloatingWindowDisplayStyle',
    },
    entries: [
      { member: '0', resourceKey: { 'zh-CN': 'O_DisplayStyle_IconText', 'en-US': 'O_DisplayStyle_IconText', 'ja-JP': 'O_DisplayStyle_IconText' } },
      { member: '1', resourceKey: { 'zh-CN': 'O_DisplayStyle_Icon', 'en-US': 'O_DisplayStyle_Icon', 'ja-JP': 'O_DisplayStyle_Icon' } },
      { member: '2', resourceKey: { 'zh-CN': 'O_DisplayStyle_Text', 'en-US': 'O_DisplayStyle_Text', 'ja-JP': 'O_DisplayStyle_Text' } },
    ],
  },
  'floating_window.stick_to_edge_display_style': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/FloatingWindow',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Personalized/FloatingWindowSettingsPage.axaml',
      anchor: 'S_Interaction_StickToEdgeDisplayStyle',
      property: 'StickToEdgeDisplayStyle',
    },
    entries: [
      { member: '0', resourceKey: { 'zh-CN': 'O_StickDisplay_Icon', 'en-US': 'O_StickDisplay_Icon', 'ja-JP': 'O_StickDisplay_Icon' } },
      { member: '1', resourceKey: { 'zh-CN': 'O_StickDisplay_Text', 'en-US': 'O_StickDisplay_Text', 'ja-JP': 'O_StickDisplay_Text' } },
      { member: '2', resourceKey: { 'zh-CN': 'O_StickDisplay_Arrow', 'en-US': 'O_StickDisplay_Arrow', 'ja-JP': 'O_StickDisplay_Arrow' } },
    ],
  },
  'linkage.data_source': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Linkage',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Linkage/LinkageSettingsPage.axaml',
      anchor: 'S_External_DataSource',
      property: 'DataSource',
    },
    entries: [
      { member: 'Off', resourceKey: { 'zh-CN': 'O_DataSource_Off', 'en-US': 'O_DataSource_Off', 'ja-JP': 'O_DataSource_Off' } },
      { member: 'Cses', resourceKey: { 'zh-CN': 'O_DataSource_Cses', 'en-US': 'O_DataSource_Cses', 'ja-JP': 'O_DataSource_Cses' } },
      { member: 'ClassIsland', resourceKey: { 'zh-CN': 'O_DataSource_ClassIsland', 'en-US': 'O_DataSource_ClassIsland', 'ja-JP': 'O_DataSource_ClassIsland' } },
    ],
  },
  'linkage.subject_history_break_assignment': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/Linkage',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/Linkage/LinkageSettingsPage.axaml',
      anchor: 'S_SubjectHistory_BreakAssignment',
      property: 'SubjectHistoryBreakAssignment',
    },
    entries: [
      { member: 'Break', resourceKey: { 'zh-CN': 'O_BreakAssignment_Break', 'en-US': 'O_BreakAssignment_Break', 'ja-JP': 'O_BreakAssignment_Break' } },
      { member: 'PreviousClass', resourceKey: { 'zh-CN': 'O_BreakAssignment_PreviousClass', 'en-US': 'O_BreakAssignment_PreviousClass', 'ja-JP': 'O_BreakAssignment_PreviousClass' } },
      { member: 'NextClass', resourceKey: { 'zh-CN': 'O_BreakAssignment_NextClass', 'en-US': 'O_BreakAssignment_NextClass', 'ja-JP': 'O_BreakAssignment_NextClass' } },
    ],
  },

  
  'more.roll_call_control_panel_position': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/More',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/More/MoreSettingsPage.axaml',
      anchor: 'S_RollCallPanelPosition',
      property: 'RollCallControlPanelPosition',
    },
    entries: [
      { member: 'Right', resourceKey: { 'zh-CN': 'O_Right', 'en-US': 'O_Right', 'ja-JP': 'O_Right' } },
      { member: 'Left', resourceKey: { 'zh-CN': 'O_Left', 'en-US': 'O_Left', 'ja-JP': 'O_Left' } },
    ],
  },
  'more.lottery_control_panel_position': {
    resourceDirectory: 'SecRandom/Langs/SettingsPages/More',
    xaml: {
      file: 'SecRandom/Views/SettingsPages/More/MoreSettingsPage.axaml',
      anchor: 'S_LotteryPanelPosition',
      property: 'LotteryControlPanelPosition',
    },
    entries: [
      { member: 'Right', resourceKey: { 'zh-CN': 'O_Right', 'en-US': 'O_Right', 'ja-JP': 'O_Right' } },
      { member: 'Left', resourceKey: { 'zh-CN': 'O_Left', 'en-US': 'O_Left', 'ja-JP': 'O_Left' } },
    ],
  },
}





















export const CLIENT_SETTING_OPTION_EXCEPTIONS: readonly OptionLabelException[] = []


export const CLIENT_SETTING_OPTION_LABELS_SOURCE_INFO: {
  repo: string
  clientCommit: string
  files: readonly string[]
} = {
  repo: 'SecRandom',
  clientCommit: 'e0b830a5',
  files: [
    
    'SecRandom/Langs/SettingsPages/Picking/Resources.resx',
    'SecRandom/Langs/SettingsPages/Picking/Resources.en-US.resx',
    'SecRandom/Langs/SettingsPages/Picking/Resources.ja-JP.resx',
    'SecRandom/Langs/SettingsPages/Voice/Resources.resx',
    'SecRandom/Langs/SettingsPages/Voice/Resources.en-US.resx',
    'SecRandom/Langs/SettingsPages/Voice/Resources.ja-JP.resx',
    'SecRandom/Langs/SettingsPages/More/Resources.resx',
    'SecRandom/Langs/SettingsPages/More/Resources.en-US.resx',
    'SecRandom/Langs/SettingsPages/More/Resources.ja-JP.resx',
    'SecRandom/Langs/SettingsPages/Personalized/Appearance/Resources.resx',
    'SecRandom/Langs/SettingsPages/Personalized/Appearance/Resources.en-US.resx',
    'SecRandom/Langs/SettingsPages/Personalized/Appearance/Resources.ja-JP.resx',
    'SecRandom/Langs/SettingsPages/FloatingWindow/Resources.resx',
    'SecRandom/Langs/SettingsPages/FloatingWindow/Resources.en-US.resx',
    'SecRandom/Langs/SettingsPages/FloatingWindow/Resources.ja-JP.resx',
    'SecRandom/Langs/SettingsPages/Linkage/Resources.resx',
    'SecRandom/Langs/SettingsPages/Linkage/Resources.en-US.resx',
    'SecRandom/Langs/SettingsPages/Linkage/Resources.ja-JP.resx',
    
    'SecRandom/Views/SettingsPages/Picking/RollCallDrawSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Picking/QuickDrawSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Picking/LotteryDrawSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/More/MoreSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Personalized/AppearanceSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Personalized/FloatingWindowSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Linkage/LinkageSettingsPage.axaml',
    
    'SecRandom/Views/SettingsPages/Notification/VoiceSettingsPage.axaml.cs',
    
    'SecRandom.Core/Enums/Configs/DrawMode.cs',
    'SecRandom.Core/Enums/Configs/ClearRecordMode.cs',
    'SecRandom.Core/Enums/Configs/UseGlobalFontMode.cs',
    'SecRandom.Core/Enums/Configs/DisplayFormatMode.cs',
    'SecRandom.Core/Enums/Configs/DisplayStyleMode.cs',
    'SecRandom.Core/Enums/Configs/AnimationMode.cs',
    'SecRandom.Core/Enums/Configs/DrawAnimationStyleMode.cs',
    'SecRandom.Core/Enums/Configs/AnimationColorThemeMode.cs',
    'SecRandom.Core/Enums/Configs/StudentImagePositionMode.cs',
    'SecRandom.Core/Enums/Configs/LotteryShowRandomMode.cs',
    'SecRandom.Core/Enums/Configs/OmniTtsProvider.cs',
    'SecRandom.Core/Enums/Configs/RollCallControlPanelPosition.cs',
    'SecRandom.Core/Enums/Configs/ThemeMode.cs',
    'SecRandom.Core/Enums/Configs/ThemeColorMode.cs',
    'SecRandom.Core/Enums/Configs/FontWeightMode.cs',
    'SecRandom.Core/Enums/Configs/TopmostMode.cs',
    'SecRandom.Core/Enums/Configs/LinkageDataSource.cs',
    'SecRandom.Core/Enums/Configs/LinkageBreakAssignment.cs',
  ],
}


export function optionLabelsOf(
  path: string,
): Readonly<Record<string, OptionLabel>> | undefined {
  return CLIENT_SETTING_OPTION_LABELS[path]
}







export function optionLabelOf(
  path: string,
  member: string,
  language: ClientSettingOptionLanguage,
): string | undefined {
  return CLIENT_SETTING_OPTION_LABELS[path]?.[member]?.[language]
}
