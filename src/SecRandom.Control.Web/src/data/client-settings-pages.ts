



















































export type ClientSettingLocale = 'zh-CN' | 'en-US' | 'ja-JP'


export type ClientSettingText = Partial<Record<ClientSettingLocale, string>>









export interface ClientSettingVisibilityCondition {
  
  path: string
  
  equals?: unknown
  
  notEquals?: unknown
}








export interface ClientSettingVisibility {
  all: readonly ClientSettingVisibilityCondition[]
}









export interface ClientSettingOption {
  
  value: string
  
  labels: ClientSettingText
}


export type ClientSettingOptionEntry = string | ClientSettingOption


export interface ClientSettingValueRow {
  



  kind?: 'row'
  
  path: string
  
  labels: ClientSettingText
  descriptions?: ClientSettingText
  
  icon: string
  







  control: 'toggle' | 'number' | 'select' | 'text' | 'readonly' | 'hotkey'
  
  options?: readonly ClientSettingOptionEntry[]
  









  rows?: ClientSettingRow[]
  
  expanded?: boolean
  







  readonly?: boolean
  










  visibleWhen?: ClientSettingVisibility
}














export interface ClientSettingContainerRow {
  kind: 'container'
  




  id: string
  
  labels: ClientSettingText
  descriptions?: ClientSettingText
  
  icon: string
  
  rows: ClientSettingRow[]
  
  expanded?: boolean
  
  visibleWhen?: ClientSettingVisibility
}







export type ClientSettingRow = ClientSettingValueRow | ClientSettingContainerRow


export function isClientSettingContainer(
  row: ClientSettingRow,
): row is ClientSettingContainerRow {
  return row.kind === 'container'
}


export interface ClientSettingSection {
  id: string
  title: string
  
  icon?: string
  rows: ClientSettingRow[]
}


export interface ClientSettingsPage {
  




  id: string
  





  title: string
  
  groupId: string
  
  icon: string
  sections: ClientSettingSection[]
}

export const CLIENT_SETTINGS_PAGES: readonly ClientSettingsPage[] = [
  {
    






















    id: 'appearance',
    title: '外观',
    groupId: 'personalized',
    icon: 'LayerDiagonalSparkleFilled',
    sections: [
      {
        
        id: 'theme',
        title: '主题',
        icon: 'ColorFilled',
        rows: [
          {
            
            
            path: 'appearance.theme',
            labels: { 'zh-CN': '主题模式', 'en-US': 'Theme mode', 'ja-JP': 'テーマモード' },
            descriptions: {
              'zh-CN': '选择软件界面主题样式',
              'en-US': 'Choose the app theme',
              'ja-JP': 'アプリのテーマを選択',
            },
            icon: 'DarkThemeFilled',
            control: 'select',
            options: ['Light', 'Dark', 'Auto'],
          },
          {
            
            
            
            path: 'appearance.theme_color_mode',
            labels: { 'zh-CN': '主题颜色', 'en-US': 'Theme color', 'ja-JP': 'テーマカラー' },
            descriptions: {
              'zh-CN': '设置软件界面主题色彩',
              'en-US': 'Set the app theme color',
              'ja-JP': 'アプリのテーマカラーを設定',
            },
            icon: 'ColorFilled',
            control: 'select',
            options: ['System', 'Custom'],
          },
        ],
      },
      {
        
        id: 'font',
        title: '字体',
        icon: 'TextFontFilled',
        rows: [
          {
            path: 'appearance.font',
            labels: { 'zh-CN': '字体家族', 'en-US': 'Font family', 'ja-JP': 'フォントファミリー' },
            descriptions: {
              'zh-CN': '设置软件界面显示字体家族',
              'en-US': 'Set the font family used by the app',
              'ja-JP': 'アプリに表示するフォントファミリーを設定',
            },
            icon: 'TextFontFilled',
            control: 'text',
            
            
            readonly: true,
          },
          {
            
            
            path: 'appearance.font_weight',
            labels: { 'zh-CN': '字体粗细', 'en-US': 'Font weight', 'ja-JP': 'フォントの太さ' },
            descriptions: {
              'zh-CN': '设置软件界面字体粗细',
              'en-US': 'Set the app font weight',
              'ja-JP': 'アプリのフォントの太さを設定',
            },
            icon: 'TextBoldFilled',
            control: 'select',
            options: [
              'Thin',
              'ExtraLight',
              'Light',
              'Regular',
              'Medium',
              'SemiBold',
              'Bold',
              'ExtraBold',
              'Black',
            ],
          },
        ],
      },
    ],
  },
  {
    





























    id: 'floating_window',
    title: '浮窗管理',
    groupId: 'personalized',
    icon: 'WindowAppsFilled',
    sections: [
      {
        id: 'display',
        title: '窗口显示',
        icon: 'WindowFilled',
        rows: [
          {
            path: 'floating_window.startup_display_floating_window',
            labels: { 'zh-CN': '启动时显示悬浮窗', 'en-US': 'Show floating window at startup', 'ja-JP': '起動時に表示' },
            descriptions: {
              'zh-CN': '控制程序启动后是否自动打开悬浮窗',
              'en-US': 'Automatically open the floating window after the program starts',
              'ja-JP': '起動後にフローティングウィンドウを自動で開きます',
            },
            icon: 'WindowFilled',
            control: 'toggle',
          },
          {
            path: 'floating_window.floating_window_opacity',
            labels: { 'zh-CN': '悬浮窗不透明度', 'en-US': 'Floating window opacity', 'ja-JP': '不透明度' },
            descriptions: {
              'zh-CN': '同时应用到主悬浮窗和闪抽浮窗',
              'en-US': 'Applies to both the main floating window and the quick-draw window',
              'ja-JP': 'メインとクイック抽選の両方に適用します',
            },
            icon: 'ColorFilled',
            control: 'number',
          },
          {
            










            path: 'floating_window.floating_window_topmost_mode',
            labels: { 'zh-CN': '悬浮窗置顶模式', 'en-US': 'Floating window topmost mode', 'ja-JP': '最前面表示モード' },
            descriptions: {
              'zh-CN': '选择悬浮窗置顶方式，UIAccess 会在重启时请求管理员权限，取消或失败时本次启动使用普通置顶',
              'en-US': 'Choose how the floating window stays on top (UIAccess requests administrator permission on restart; cancellation or failure uses ordinary topmost for this launch)',
              'ja-JP': 'フローティングウィンドウの最前面方法を選択します、UIAccess は再起動時に管理者権限を要求し、取り消しまたは失敗した場合は今回の起動で通常の最前面表示を使用します',
            },
            icon: 'PinFilled',
            control: 'select',
            options: ['None', 'Topmost', 'UiAccess'],
          },
        ],
      },
      {
        id: 'buttons',
        title: '悬浮窗控件',
        icon: 'FlashFilled',
        rows: [
          {
            






            kind: 'container',
            id: 'enabledItems',
            labels: { 'zh-CN': '悬浮窗控件', 'en-US': 'Floating Window Controls', 'ja-JP': '表示する操作' },
            descriptions: {
              'zh-CN': '选择主悬浮窗中显示的功能入口',
              'en-US': 'Choose the feature entries shown in the main floating window',
              'ja-JP': 'メインウィンドウに表示する機能を選択します',
            },
            icon: 'PersonFilled',
            rows: [
              {
                path: 'floating_window.show_roll_call_button',
                labels: { 'zh-CN': '点名', 'en-US': 'Roll Call', 'ja-JP': '点呼' },
                descriptions: {
                  'zh-CN': '在悬浮窗中显示点名入口',
                  'en-US': 'Show the roll-call entry in the floating window',
                  'ja-JP': '点呼の入口を表示します',
                },
                icon: 'PersonFilled',
                control: 'toggle',
              },
              {
                path: 'floating_window.show_quick_draw_button',
                labels: { 'zh-CN': '闪抽', 'en-US': 'Quick Draw', 'ja-JP': 'クイック抽選' },
                descriptions: {
                  'zh-CN': '在悬浮窗中显示快速抽取入口',
                  'en-US': 'Show the quick-draw entry in the floating window',
                  'ja-JP': 'クイック抽選の入口を表示します',
                },
                icon: 'PersonFilled',
                control: 'toggle',
              },
              {
                path: 'floating_window.show_lottery_button',
                labels: { 'zh-CN': '抽奖', 'en-US': 'Lottery', 'ja-JP': '抽選' },
                descriptions: {
                  'zh-CN': '在悬浮窗中显示抽奖入口',
                  'en-US': 'Show the lottery entry in the floating window',
                  'ja-JP': '抽選の入口を表示します',
                },
                icon: 'PersonFilled',
                control: 'toggle',
              },
              {
                
                
                path: 'floating_window.show_timer_button',
                labels: { 'zh-CN': '计时器', 'en-US': 'Timer', 'ja-JP': 'タイマー' },
                descriptions: {
                  'zh-CN': '在悬浮窗中显示计时器入口',
                  'en-US': 'Shows the timer entry in the floating window',
                  'ja-JP': 'フローティングウィンドウにタイマーの入口を表示します',
                },
                icon: 'PersonFilled',
                control: 'toggle',
              },
            ],
          },
          {
            
            
            path: 'floating_window.floating_window_placement',
            labels: { 'zh-CN': '控件排列', 'en-US': 'Control layout', 'ja-JP': '操作の配置' },
            descriptions: {
              'zh-CN': '矩形为双列网格，纵向和横向按单列排列',
              'en-US': 'Rectangle uses a two-column grid; vertical and horizontal use a single column',
              'ja-JP': '矩形は2列、縦と横は1列で配置します',
            },
            icon: 'GridFilled',
            control: 'select',
            options: ['0', '1', '2'],
          },
          {
            
            path: 'floating_window.floating_window_display_style',
            labels: { 'zh-CN': '控件显示样式', 'en-US': 'Control display style', 'ja-JP': '表示形式' },
            descriptions: {
              'zh-CN': '选择悬浮窗控件显示图标、文字或二者同时显示',
              'en-US': 'Choose icons, text, or both for floating-window controls',
              'ja-JP': 'アイコン、文字、または両方を選択します',
            },
            icon: 'TextBulletListSquareFilled',
            control: 'select',
            options: ['0', '1', '2'],
          },
          {
            path: 'floating_window.floating_window_size',
            labels: { 'zh-CN': '控件尺寸', 'en-US': 'Control size', 'ja-JP': '操作のサイズ' },
            descriptions: {
              'zh-CN': '调整每个正方形控件的边长，图标和文字会同步缩放',
              'en-US': 'Adjust the side length of each square control; the icon and text scale with it',
              'ja-JP': '各操作の正方形サイズを調整します',
            },
            icon: 'ResizeLargeFilled',
            control: 'number',
          },
        ],
      },
      {
        id: 'interaction',
        title: '移动与贴边',
        icon: 'GestureFilled',
        rows: [
          {
            path: 'floating_window.draggable',
            labels: { 'zh-CN': '可拖动', 'en-US': 'Draggable', 'ja-JP': 'ドラッグ可能' },
            descriptions: {
              'zh-CN': '关闭后主悬浮窗和收纳手柄都不能拖动',
              'en-US': 'When disabled, neither the main floating window nor its handle can be dragged',
              'ja-JP': '無効にすると本体とハンドルをドラッグできません',
            },
            icon: 'GestureFilled',
            control: 'toggle',
          },
          {
            path: 'floating_window.stick_to_edge',
            labels: { 'zh-CN': '贴边功能', 'en-US': 'Edge docking', 'ja-JP': '端に吸着' },
            descriptions: {
              'zh-CN': '拖动松开后自动吸附到当前屏幕最近的左侧或右侧边缘',
              'en-US': 'Snap to the nearest left or right edge of the current screen when dragging ends',
              'ja-JP': 'ドラッグ終了時に現在の画面の左右どちらか近い端へ吸着します',
            },
            icon: 'DockFilled',
            control: 'toggle',
          },
        ],
      },
      {
        id: 'dock',
        title: '贴边收纳',
        icon: 'DockFilled',
        rows: [
          {
            path: 'floating_window.stick_to_edge_recover_seconds',
            labels: { 'zh-CN': '自动收纳延迟', 'en-US': 'Auto-collapse delay', 'ja-JP': '自動収納までの遅延' },
            descriptions: {
              'zh-CN': '贴边后等待指定秒数再收纳；设为 0 时保持展开',
              'en-US': 'Wait this many seconds after docking before collapsing; set to 0 to keep expanded',
              'ja-JP': '吸着後に収納するまでの秒数で、0 で展開したままにします',
            },
            icon: 'TimerFilled',
            control: 'number',
          },
          {
            path: 'floating_window.docked_window_size',
            labels: { 'zh-CN': '收纳手柄尺寸', 'en-US': 'Handle size', 'ja-JP': 'ハンドルサイズ' },
            descriptions: {
              'zh-CN': '调整贴边收纳后边缘手柄的正方形边长',
              'en-US': 'Adjust the square side length of the edge handle',
              'ja-JP': '収納ハンドルの正方形サイズを調整します',
            },
            icon: 'ResizeLargeFilled',
            control: 'number',
          },
          {
            
            
            path: 'floating_window.stick_to_edge_display_style',
            labels: { 'zh-CN': '收纳手柄样式', 'en-US': 'Collapsed handle style', 'ja-JP': '収納ハンドルの表示' },
            descriptions: {
              'zh-CN': '选择收纳后边缘手柄显示点名图标、“抽”字或方向箭头',
              'en-US': 'Choose a roll-call icon, the word “Draw,” or a direction arrow for the edge handle',
              'ja-JP': '点呼アイコン、「抽選」の文字、または矢印を選択します',
            },
            icon: 'DockFilled',
            control: 'select',
            options: ['0', '1', '2'],
          },
        ],
      },
    ],
  },
  {
    

















    id: 'timer',
    title: '计时器',
    groupId: 'personalized',
    icon: 'TimerFilled',
    sections: [
      {
        
        id: 'autoMiniWindow',
        title: '自动缩小为小窗',
        icon: 'ArrowMinimizeFilled',
        rows: [
          {
            
            path: 'timer.auto_mini_window_countdown_enabled',
            labels: { 'zh-CN': '倒计时', 'en-US': 'Countdown', 'ja-JP': 'カウントダウン' },
            descriptions: {
              'zh-CN': '倒计时页面无操作到设定时长后自动缩成小窗',
              'en-US': 'Shrinks to the mini window once the countdown page has been left untouched for the configured duration',
              'ja-JP': 'カウントダウンページを設定時間操作しないと自動で小窓に縮小します',
            },
            icon: 'TimerFilled',
            control: 'toggle',
          },
          {
            
            path: 'timer.auto_mini_window_stopwatch_enabled',
            labels: { 'zh-CN': '秒表', 'en-US': 'Stopwatch', 'ja-JP': 'ストップウォッチ' },
            descriptions: {
              'zh-CN': '秒表页面无操作到设定时长后自动缩成小窗',
              'en-US': 'Shrinks to the mini window once the stopwatch page has been left untouched for the configured duration',
              'ja-JP': 'ストップウォッチページを設定時間操作しないと自動で小窓に縮小します',
            },
            icon: 'HourglassFilled',
            control: 'toggle',
          },
          {
            
            path: 'timer.auto_mini_window_clock_enabled',
            labels: { 'zh-CN': '时钟', 'en-US': 'Clock', 'ja-JP': '時計' },
            descriptions: {
              'zh-CN': '时钟页面无操作到设定时长后自动缩成小窗',
              'en-US': 'Shrinks to the mini window once the clock page has been left untouched for the configured duration',
              'ja-JP': '時計ページを設定時間操作しないと自動で小窓に縮小します',
            },
            icon: 'ClockFilled',
            control: 'toggle',
          },
          {
            
            
            path: 'timer.auto_mini_window_after_seconds',
            labels: { 'zh-CN': '自动缩小时间', 'en-US': 'Auto-shrink delay', 'ja-JP': '自動縮小までの時間' },
            descriptions: {
              'zh-CN': '页面多久没有任何操作之后自动缩成小窗（打开页面本身算一次操作）',
              'en-US':
                'How long the page can be left untouched before the mini window opens (opening the page itself counts as an action)',
              'ja-JP': 'ページを何秒間操作しないと小窓へ縮小するか（ページを開いた時点も操作として数えます）',
            },
            icon: 'ArrowClockwiseFilled',
            control: 'number',
          },
        ],
      },
    ],
  },
  {
    
























    id: 'linkage',
    title: '联动设置',
    groupId: 'personalized',
    icon: 'CalendarLtrFilled',
    sections: [
      {
        id: 'external',
        title: '课程联动',
        icon: 'LinkFilled',
        rows: [
          {
            path: 'linkage.instant_draw_disable',
            labels: { 'zh-CN': '限制非上课时段操作', 'en-US': 'Restrict off-class operations', 'ja-JP': '授業外の操作を制限' },
            descriptions: {
              'zh-CN': '课程数据源明确显示处于课间或非上课时段时，限制抽取和重置；关闭后不作限制',
              'en-US': 'Restrict drawing and reset when course data confirms a break or non-class period; disable for no restriction',
              'ja-JP': '休み時間や授業外と確認された場合に抽選とリセットを制限します',
            },
            icon: 'FlashFilled',
            control: 'toggle',
          },
          {
            
            
            path: 'linkage.verification_required',
            visibleWhen: { all: [{ path: 'linkage.instant_draw_disable', equals: true }] },
            labels: { 'zh-CN': '允许验证后继续', 'en-US': 'Allow verified continuation', 'ja-JP': '認証後の続行を許可' },
            descriptions: {
              'zh-CN': '仅在已启用非上课时段限制时生效；开启后，通过已配置的安全验证可以临时继续抽取或重置；关闭后将直接阻止',
              'en-US': 'When off-class restrictions are enabled, allow temporary drawing or reset after configured security verification; otherwise block directly',
              'ja-JP': '授業外制限が有効な場合、設定したセキュリティ認証後に一時的な抽選やリセットを許可します',
            },
            icon: 'ShieldCheckmarkFilled',
            control: 'toggle',
          },
          {
            
            
            path: 'linkage.data_source',
            labels: { 'zh-CN': '数据源', 'en-US': 'Data source', 'ja-JP': 'データソース' },
            descriptions: {
              'zh-CN': '选择课程或外部联动数据来源',
              'en-US': 'Choose the course or external linkage source',
              'ja-JP': '授業または外部連携のデータソースを選択します',
            },
            icon: 'DatabaseFilled',
            control: 'select',
            options: ['Off', 'Cses', 'ClassIsland'],
          },
        ],
      },
      {
        id: 'classTime',
        title: '课前课后',
        icon: 'ArrowSyncFilled',
        rows: [
          {
            path: 'linkage.hide_floating_window_on_class_end',
            labels: { 'zh-CN': '下课隐藏悬浮窗', 'en-US': 'Hide floating window after class', 'ja-JP': '授業後に非表示' },
            descriptions: {
              'zh-CN': '课程结束时自动隐藏悬浮窗',
              'en-US': 'Automatically hide the floating window when class ends',
              'ja-JP': '授業終了時に自動で非表示にします',
            },
            icon: 'WindowFilled',
            control: 'toggle',
          },
          {
            path: 'linkage.pre_class_reset_enabled',
            labels: { 'zh-CN': '课前重置', 'en-US': 'Reset before class', 'ja-JP': '授業前にリセット' },
            descriptions: {
              'zh-CN': '上课前自动重置临时抽取记录',
              'en-US': 'Automatically reset temporary draw records before class',
              'ja-JP': '授業前に一時抽選記録を自動でリセットします',
            },
            icon: 'ArrowSyncFilled',
            control: 'toggle',
          },
          {
            path: 'linkage.pre_class_reset_time',
            labels: { 'zh-CN': '课前重置时间', 'en-US': 'Pre-class reset time', 'ja-JP': '授業前リセット時刻' },
            descriptions: {
              'zh-CN': '距离上课多少秒内执行课前重置',
              'en-US': 'Perform the reset within this many seconds before class',
              'ja-JP': '授業前何秒以内にリセットするか指定します',
            },
            icon: 'TimePickerFilled',
            control: 'number',
          },
          {
            path: 'linkage.pre_class_enable_time',
            labels: { 'zh-CN': '课前解禁时间', 'en-US': 'Pre-class enable time', 'ja-JP': '授業前の解除時刻' },
            descriptions: {
              'zh-CN': '上课前多少秒提前解除课间禁用',
              'en-US': 'Enable operations this many seconds before class',
              'ja-JP': '授業の何秒前に制限を解除するか指定します',
            },
            icon: 'CalendarLtrFilled',
            control: 'number',
          },
          {
            path: 'linkage.post_class_disable_delay',
            labels: { 'zh-CN': '课后禁用延迟', 'en-US': 'Post-class disable delay', 'ja-JP': '授業後の無効化遅延' },
            descriptions: {
              'zh-CN': '课程结束后延迟多少秒禁用相关抽取入口',
              'en-US': 'Delay disabling related draw entries by this many seconds after class ends',
              'ja-JP': '授業終了後、関連する抽選入口を無効にするまでの秒数',
            },
            icon: 'TimerFilled',
            control: 'number',
          },
        ],
      },
      {
        id: 'subjectHistory',
        title: '科目历史记录',
        icon: 'PeopleListFilled',
        rows: [
          {
            path: 'linkage.subject_history_filter_enabled',
            labels: { 'zh-CN': '科目历史记录过滤', 'en-US': 'Subject history filter', 'ja-JP': '科目履歴フィルター' },
            descriptions: {
              'zh-CN': '计算权重时只使用当前科目的历史记录',
              'en-US': "Use only the current subject's history when calculating weights",
              'ja-JP': '重みの計算に現在の科目の履歴だけを使用します',
            },
            icon: 'PeopleListFilled',
            control: 'toggle',
          },
          {
            
            
            
            path: 'linkage.subject_history_break_assignment',
            labels: { 'zh-CN': '课间归属', 'en-US': 'Break assignment', 'ja-JP': '休み時間の帰属' },
            descriptions: {
              'zh-CN': '选择课间时段的历史记录归属方式',
              'en-US': 'Choose how history during breaks is assigned',
              'ja-JP': '休み時間の履歴の帰属先を選択します',
            },
            icon: 'PeopleListFilled',
            control: 'select',
            options: ['Break', 'PreviousClass', 'NextClass'],
          },
        ],
      },
    ],
  },
{
    






















    id: 'more',
    title: '更多设置',
    groupId: 'personalized',
    icon: 'MoreHorizontalFilled',
    sections: [
      {
        id: 'pageManagement',
        title: '页面管理',
        icon: 'PanelRightFilled',
        rows: [
          {
            path: 'more.roll_call_control_panel_position',
            labels: {
              'zh-CN': '点名控制面板位置',
              'en-US': 'Roll-call panel position',
              'ja-JP': '点呼パネルの位置',
            },
            descriptions: {
              'zh-CN': '设置点名页控制面板显示在主内容左侧或右侧',
              'en-US': 'Show the roll-call control panel on the left or right of the main content',
              'ja-JP': '点呼ページの操作パネルを本文の左または右に表示します',
            },
            icon: 'PanelRightFilled',
            control: 'select',
            
            options: ['Right', 'Left'],
          },
          {
            





            kind: 'container',
            id: 'rollCallControls',
            labels: {
              'zh-CN': '点名页面控件',
              'en-US': 'Roll-call controls',
              'ja-JP': '点呼ページの操作',
            },
            descriptions: {
              'zh-CN': '控制点名页侧边控制面板中的控件显示',
              'en-US': 'Choose which controls appear in the roll-call side panel',
              'ja-JP': '点呼ページのサイドパネルに表示する操作を選択します',
            },
            icon: 'AppsListFilled',
            rows: [
              {
                path: 'more.roll_call_reset_button',
                labels: { 'zh-CN': '重置按钮', 'en-US': 'Reset button', 'ja-JP': 'リセットボタン' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.roll_call_quantity_control',
                labels: { 'zh-CN': '人数调节', 'en-US': 'Quantity control', 'ja-JP': '人数調整' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.roll_call_start_button',
                labels: { 'zh-CN': '开始按钮', 'en-US': 'Start button', 'ja-JP': '開始ボタン' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.roll_call_list_selector',
                labels: { 'zh-CN': '名单选择', 'en-US': 'List selector', 'ja-JP': 'リスト選択' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.roll_call_range_selector',
                labels: { 'zh-CN': '范围选择', 'en-US': 'Range selector', 'ja-JP': '範囲選択' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.roll_call_gender_selector',
                labels: { 'zh-CN': '性别选择', 'en-US': 'Gender selector', 'ja-JP': '性別選択' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.roll_call_remaining_button',
                labels: { 'zh-CN': '剩余名单按钮', 'en-US': 'Remaining list button', 'ja-JP': '残りリスト' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.roll_call_quantity_label',
                labels: { 'zh-CN': '人数统计', 'en-US': 'Quantity count', 'ja-JP': '人数' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
            ],
          },
          {
            path: 'more.lottery_enabled',
            labels: { 'zh-CN': '启用抽奖', 'en-US': 'Enable lottery', 'ja-JP': '抽選を有効化' },
            descriptions: {
              'zh-CN': '关闭后隐藏抽奖入口，并拒绝抽奖快捷键和外部指令',
              'en-US': 'Hide lottery entries and reject lottery shortcuts and external commands when disabled',
              'ja-JP': '無効にすると抽選の入口、ショートカット、外部コマンドを拒否します',
            },
            icon: 'GiftFilled',
            control: 'toggle',
          },
          {
            path: 'more.lottery_control_panel_position',
            labels: {
              'zh-CN': '抽奖控制面板位置',
              'en-US': 'Lottery panel position',
              'ja-JP': '抽選パネルの位置',
            },
            descriptions: {
              'zh-CN': '设置抽奖页控制面板显示在主内容左侧或右侧',
              'en-US': 'Show the lottery control panel on the left or right of the main content',
              'ja-JP': '抽選ページの操作パネルを本文の左または右に表示します',
            },
            icon: 'GiftFilled',
            control: 'select',
            options: ['Right', 'Left'],
            
            visibleWhen: { all: [{ path: 'more.lottery_enabled', equals: true }] },
          },
          {
            





            kind: 'container',
            id: 'lotteryControls',
            labels: {
              'zh-CN': '抽奖页面控件',
              'en-US': 'Lottery controls',
              'ja-JP': '抽選ページの操作',
            },
            descriptions: {
              'zh-CN': '控制抽奖页侧边控制面板中的控件显示',
              'en-US': 'Choose which controls appear in the lottery side panel',
              'ja-JP': '抽選ページのサイドパネルに表示する操作を選択します',
            },
            icon: 'AppsListFilled',
            visibleWhen: { all: [{ path: 'more.lottery_enabled', equals: true }] },
            rows: [
              {
                path: 'more.lottery_reset_button',
                labels: { 'zh-CN': '重置按钮', 'en-US': 'Reset button', 'ja-JP': 'リセットボタン' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.lottery_quantity_control',
                labels: { 'zh-CN': '数量调节', 'en-US': 'Quantity control', 'ja-JP': '数量調整' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.lottery_start_button',
                labels: { 'zh-CN': '开始按钮', 'en-US': 'Start button', 'ja-JP': '開始ボタン' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.lottery_list_selector',
                labels: { 'zh-CN': '奖池选择', 'en-US': 'Prize-pool selector', 'ja-JP': '賞品プール選択' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.lottery_student_list_selector',
                labels: {
                  'zh-CN': '成员名单选择',
                  'en-US': 'Member-list selector',
                  'ja-JP': 'メンバーリスト選択',
                },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.lottery_range_selector',
                labels: { 'zh-CN': '范围选择', 'en-US': 'Range selector', 'ja-JP': '範囲選択' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.lottery_gender_selector',
                labels: { 'zh-CN': '性别选择', 'en-US': 'Gender selector', 'ja-JP': '性別選択' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.lottery_remaining_button',
                labels: { 'zh-CN': '剩余名单按钮', 'en-US': 'Remaining list button', 'ja-JP': '残りリスト' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
              {
                path: 'more.lottery_quantity_label',
                labels: { 'zh-CN': '奖数统计', 'en-US': 'Prize count', 'ja-JP': '賞品数' },
                icon: 'AppsListFilled',
                control: 'toggle',
              },
            ],
          },
        ],
      },
      {
        id: 'shortcut',
        title: '快捷键',
        icon: 'FlashFilled',
        rows: [
          {
            path: 'more.enable_shortcut',
            labels: { 'zh-CN': '快捷键', 'en-US': 'Shortcuts', 'ja-JP': 'ショートカット' },
            descriptions: {
              'zh-CN': '展开后按下所需组合键；Esc 取消输入',
              'en-US': 'Expand and press the desired key combination; Esc cancels input',
              'ja-JP': '展開してキーの組み合わせを押し、Esc で入力をキャンセルします',
            },
            icon: 'KeyboardFilled',
            control: 'toggle',
            











            rows: [
              {
                path: 'more.open_roll_call_page_shortcut',
                labels: {
                  'zh-CN': '打开点名页',
                  'en-US': 'Open roll-call page',
                  'ja-JP': '点呼ページを開く',
                },
                icon: 'KeyboardFilled',
                control: 'hotkey',
              },
              {
                path: 'more.quick_draw_shortcut',
                labels: { 'zh-CN': '执行闪抽', 'en-US': 'Run quick draw', 'ja-JP': 'クイック抽選を実行' },
                icon: 'KeyboardFilled',
                control: 'hotkey',
              },
              {
                path: 'more.open_lottery_page_shortcut',
                labels: { 'zh-CN': '打开抽奖页', 'en-US': 'Open lottery page', 'ja-JP': '抽選ページを開く' },
                icon: 'KeyboardFilled',
                control: 'hotkey',
                visibleWhen: { all: [{ path: 'more.lottery_enabled', equals: true }] },
              },
              {
                path: 'more.increase_roll_call_count_shortcut',
                labels: {
                  'zh-CN': '增加点名人数',
                  'en-US': 'Increase roll-call count',
                  'ja-JP': '点呼人数を増やす',
                },
                icon: 'KeyboardFilled',
                control: 'hotkey',
              },
              {
                path: 'more.decrease_roll_call_count_shortcut',
                labels: {
                  'zh-CN': '减少点名人数',
                  'en-US': 'Decrease roll-call count',
                  'ja-JP': '点呼人数を減らす',
                },
                icon: 'KeyboardFilled',
                control: 'hotkey',
              },
              {
                path: 'more.increase_lottery_count_shortcut',
                labels: {
                  'zh-CN': '增加抽奖数量',
                  'en-US': 'Increase lottery count',
                  'ja-JP': '抽選数を増やす',
                },
                icon: 'KeyboardFilled',
                control: 'hotkey',
                visibleWhen: { all: [{ path: 'more.lottery_enabled', equals: true }] },
              },
              {
                path: 'more.decrease_lottery_count_shortcut',
                labels: {
                  'zh-CN': '减少抽奖数量',
                  'en-US': 'Decrease lottery count',
                  'ja-JP': '抽選数を減らす',
                },
                icon: 'KeyboardFilled',
                control: 'hotkey',
                visibleWhen: { all: [{ path: 'more.lottery_enabled', equals: true }] },
              },
              {
                path: 'more.start_roll_call_shortcut',
                labels: {
                  'zh-CN': '开始或停止点名',
                  'en-US': 'Start or stop roll call',
                  'ja-JP': '点呼を開始または停止',
                },
                icon: 'KeyboardFilled',
                control: 'hotkey',
              },
              {
                path: 'more.start_lottery_shortcut',
                labels: {
                  'zh-CN': '开始或停止抽奖',
                  'en-US': 'Start or stop lottery',
                  'ja-JP': '抽選を開始または停止',
                },
                icon: 'KeyboardFilled',
                control: 'hotkey',
                visibleWhen: { all: [{ path: 'more.lottery_enabled', equals: true }] },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    







    id: 'default_draw',
    title: '默认抽取设置',
    groupId: 'picking',
    icon: 'DocumentBulletListCubeFilled',
    sections: [
      {
        id: 'draw',
        title: '抽取设置',
        icon: 'FlashFilled',
        rows: [
          {
            path: 'default_draw.draw_mode',
            labels: { 'zh-CN': '抽取模式', 'en-US': 'Draw Mode', 'ja-JP': '抽選モード' },
            descriptions: {
              'zh-CN': '控制重复抽取记录的处理方式',
              'en-US': 'Controls how repeated draw records are handled',
              'ja-JP': '重複する抽選記録の扱いを指定します',
            },
            icon: 'FlashFilled',
            control: 'select',
            options: ['Repeat', 'NoRepeat', 'HalfRepeat'],
          },
          {
            path: 'default_draw.half_repeat',
            
            
            visibleWhen: { all: [{ path: 'default_draw.draw_mode', equals: 'HalfRepeat' }] },
            labels: { 'zh-CN': '半重复阈值', 'en-US': 'Half-repeat Threshold', 'ja-JP': '半重複のしきい値' },
            descriptions: {
              'zh-CN': '抽中次数达到该值后不会再次进入候选池',
              'en-US': 'After this number of draws, the item will not re-enter the candidate pool',
              'ja-JP': 'この回数抽選された項目は候補に戻りません',
            },
            icon: 'ClipboardBulletListFilled',
            control: 'number',
          },
        ],
      },
      {
        id: 'display',
        title: '显示设置',
        icon: 'TextFontFilled',
        rows: [
          {
            path: 'default_draw.use_global_font',
            labels: { 'zh-CN': '字体来源', 'en-US': 'Font Source', 'ja-JP': 'フォントの指定元' },
            descriptions: {
              'zh-CN': '跟随全局字体或为抽取结果单独指定字体',
              'en-US': 'Follow the global font or specify a font for draw results',
              'ja-JP': '全体設定に従うか、抽選結果専用のフォントを指定します',
            },
            icon: 'TextFontFilled',
            control: 'select',
            options: ['FollowGlobal', 'Custom'],
            
            readonly: true,
          },
          {
            path: 'default_draw.custom_font',
            
            visibleWhen: { all: [{ path: 'default_draw.use_global_font', equals: 'Custom' }] },
            labels: { 'zh-CN': '自定义字体', 'en-US': 'Custom Font', 'ja-JP': 'カスタムフォント' },
            descriptions: {
              'zh-CN': '字体族名称，留空时使用默认字体',
              'en-US': 'Font family name; leave empty to use the default font',
              'ja-JP': 'フォントファミリー名を指定し、空欄の場合は既定のフォントを使用します',
            },
            icon: 'TextFontFilled',
            control: 'text',
            
            
            readonly: true,
          },
          {
            path: 'default_draw.display_style',
            labels: { 'zh-CN': '显示样式', 'en-US': 'Display Style', 'ja-JP': '表示スタイル' },
            descriptions: {
              'zh-CN': '控制抽取结果的整体样式',
              'en-US': 'Controls the overall style of draw results',
              'ja-JP': '抽選結果全体のスタイルを指定します',
            },
            icon: 'CardUiFilled',
            control: 'select',
            options: ['Default', 'Card'],
          },
          {
            path: 'default_draw.show_weight_transparency',
            labels: { 'zh-CN': '权重透明化', 'en-US': 'Show Weight Transparency', 'ja-JP': '重みを表示' },
            descriptions: {
              'zh-CN': '在结果展示中显示权重透明信息',
              'en-US': 'Show weight information in the result display',
              'ja-JP': '結果表示に重みの情報を表示します',
            },
            icon: 'DataHistogramFilled',
            control: 'toggle',
          },
          {
            path: 'default_draw.font_size',
            labels: { 'zh-CN': '字体大小', 'en-US': 'Font Size', 'ja-JP': 'フォントサイズ' },
            descriptions: {
              'zh-CN': '抽取结果文字大小',
              'en-US': 'Text size for draw results',
              'ja-JP': '抽選結果の文字サイズ',
            },
            icon: 'TextFontFilled',
            control: 'number',
          },
          {
            path: 'default_draw.display_format',
            labels: { 'zh-CN': '显示格式', 'en-US': 'Display Format', 'ja-JP': '表示形式' },
            descriptions: {
              'zh-CN': '控制结果中显示名称、编号或两者',
              'en-US': 'Choose whether results show names, numbers, or both',
              'ja-JP': '結果に名称、番号、または両方を表示するか指定します',
            },
            icon: 'TextFontFilled',
            control: 'select',
            options: ['Both', 'Name', 'Id'],
          },
          {
            path: 'default_draw.show_tags',
            labels: { 'zh-CN': '显示标签', 'en-US': 'Show Tags', 'ja-JP': 'タグを表示' },
            descriptions: {
              'zh-CN': '抽取结果中展示成员或奖品标签',
              'en-US': 'Show member or prize tags in draw results',
              'ja-JP': '抽選結果にメンバーまたは景品のタグを表示します',
            },
            icon: 'TagFilled',
            control: 'toggle',
          },
        ],
      },
      {
        id: 'animation',
        title: '动画设置',
        icon: 'FlashFilled',
        rows: [
          {
            path: 'default_draw.animation',
            labels: { 'zh-CN': '动画模式', 'en-US': 'Animation Mode', 'ja-JP': 'アニメーションモード' },
            descriptions: {
              'zh-CN': '设置抽取动画播放方式',
              'en-US': 'Set how the draw animation plays',
              'ja-JP': '抽選アニメーションの再生方法',
            },
            icon: 'FlashFilled',
            control: 'select',
            options: ['ManualStop', 'AutoPlay', 'NoAnimation'],
          },
          {
            path: 'default_draw.animation_interval',
            
            visibleWhen: { all: [{ path: 'default_draw.animation', notEquals: 'NoAnimation' }] },
            labels: { 'zh-CN': '动画间隔', 'en-US': 'Animation Interval', 'ja-JP': 'アニメーション間隔' },
            descriptions: {
              'zh-CN': '抽取动画每次切换的间隔（毫秒）',
              'en-US': 'Interval between draw animation changes (milliseconds)',
              'ja-JP': '抽選アニメーションの切り替え間隔（ミリ秒）',
            },
            icon: 'TimerFilled',
            control: 'number',
          },
          {
            path: 'default_draw.autoplay_count',
            
            visibleWhen: { all: [{ path: 'default_draw.animation', equals: 'AutoPlay' }] },
            labels: { 'zh-CN': '自动播放次数', 'en-US': 'Autoplay Count', 'ja-JP': '自動再生回数' },
            descriptions: {
              'zh-CN': '自动播放模式下滚动候选结果的次数',
              'en-US': 'Number of candidate result changes in autoplay mode',
              'ja-JP': '自動再生時に候補結果を切り替える回数',
            },
            icon: 'NumberSymbolFilled',
            control: 'number',
          },
          {
            path: 'default_draw.animation_style',
            visibleWhen: { all: [{ path: 'default_draw.animation', notEquals: 'NoAnimation' }] },
            labels: { 'zh-CN': '动画样式', 'en-US': 'Animation Style', 'ja-JP': 'アニメーションスタイル' },
            descriptions: {
              'zh-CN': '设置抽取过程和最终定格时使用的统一动画效果',
              'en-US': 'Unified animation effect for the draw process and final result',
              'ja-JP': '抽選中と最終結果に使用する統一アニメーション',
            },
            icon: 'SlidePlayFilled',
            control: 'select',
            options: ['DirectRotate', 'FadeFloat', 'HorizontalShake'],
          },
        ],
      },
      {
        id: 'color',
        title: '颜色设置',
        icon: 'ColorFilled',
        rows: [
          {
            path: 'default_draw.animation_color_theme',
            labels: { 'zh-CN': '颜色主题', 'en-US': 'Color Theme', 'ja-JP': 'カラーテーマ' },
            descriptions: {
              'zh-CN': '设置抽取动画和结果颜色来源',
              'en-US': 'Set the source of colors for draw animations and results',
              'ja-JP': '抽選アニメーションと結果の色の指定元',
            },
            icon: 'ColorFilled',
            control: 'select',
            options: ['None', 'Random', 'Fixed'],
          },
        ],
      },
      {
        id: 'studentImage',
        title: '成员头像设置',
        icon: 'ImageFilled',
        rows: [
          {
            path: 'default_draw.student_image',
            labels: { 'zh-CN': '显示头像', 'en-US': 'Show Member Images', 'ja-JP': '画像を表示' },
            descriptions: {
              'zh-CN': '在抽取结果中显示成员头像',
              'en-US': 'Show member images in draw results',
              'ja-JP': '抽選結果にメンバー画像を表示します',
            },
            icon: 'ImageFilled',
            control: 'toggle',
            
            
            readonly: true,
          },
          {
            path: 'default_draw.student_image_position',
            labels: { 'zh-CN': '头像位置', 'en-US': 'Image Position', 'ja-JP': '画像の位置' },
            descriptions: {
              'zh-CN': '成员头像相对文字的位置',
              'en-US': 'Position of the member image relative to the text',
              'ja-JP': '文字に対するメンバー画像の位置',
            },
            icon: 'ImageFilled',
            control: 'select',
            options: ['Left', 'Top', 'Right', 'Bottom'],
          },
          {
            
            
            path: 'default_draw.student_image_size',
            labels: { 'zh-CN': '头像大小', 'en-US': 'Image Size', 'ja-JP': '画像サイズ' },
            descriptions: {
              'zh-CN': '抽取结果中头像的显示边长，单位为像素',
              'en-US': 'Display edge length of member images in draw results, in pixels',
              'ja-JP': '抽選結果に表示するメンバー画像の一辺の長さ（ピクセル）',
            },
            icon: 'ImageFilled',
            control: 'number',
          },
        ],
      },
      {
        id: 'music',
        title: '音乐设置',
        icon: 'Speaker2Filled',
        rows: [
          {
            











            kind: 'container',
            id: 'music',
            labels: { 'zh-CN': '音乐设置', 'en-US': 'Music Settings', 'ja-JP': '音楽設定' },
            icon: 'Speaker2Filled',
            rows: [
              {
                path: 'default_draw.animation_music',
                labels: { 'zh-CN': '动画音乐', 'en-US': 'Animation Music', 'ja-JP': 'アニメーション音楽' },
                descriptions: {
                  'zh-CN': '选择抽取动画播放时使用的音乐',
                  'en-US': 'Music used while the draw animation plays',
                  'ja-JP': '抽選アニメーション中に再生する音楽',
                },
                icon: 'Speaker2Filled',
                control: 'text',
                
                
                readonly: true,
              },
              {
                path: 'default_draw.animation_music_loop',
                labels: {
                  'zh-CN': '循环播放动画音乐',
                  'en-US': 'Loop Animation Music',
                  'ja-JP': 'アニメーション音楽をループ',
                },
                descriptions: {
                  'zh-CN': '动画持续期间重复播放动画音乐',
                  'en-US': 'Repeat animation music while the animation continues',
                  'ja-JP': 'アニメーション中に音楽を繰り返します',
                },
                icon: 'Speaker2Filled',
                control: 'toggle',
              },
              {
                path: 'default_draw.animation_music_volume',
                labels: {
                  'zh-CN': '动画音乐音量',
                  'en-US': 'Animation Music Volume',
                  'ja-JP': 'アニメーション音楽の音量',
                },
                descriptions: {
                  'zh-CN': '设置抽取动画音乐的音量',
                  'en-US': 'Set the animation music volume',
                  'ja-JP': 'アニメーション音楽の音量',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'default_draw.result_music_volume',
                labels: { 'zh-CN': '结果音乐音量', 'en-US': 'Result Music Volume', 'ja-JP': '結果音楽の音量' },
                descriptions: {
                  'zh-CN': '设置抽取结果音乐的音量',
                  'en-US': 'Set the result music volume',
                  'ja-JP': '結果音楽の音量',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'default_draw.animation_music_fade_in',
                labels: {
                  'zh-CN': '动画音乐淡入',
                  'en-US': 'Animation music fade-in',
                  'ja-JP': 'アニメーション音楽のフェードイン',
                },
                descriptions: {
                  'zh-CN': '动画音乐开始播放时的渐入时间（毫秒）',
                  'en-US': 'Fade-in time of the animation music, in milliseconds',
                  'ja-JP': 'アニメーション音楽の再生開始時のフェードイン時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'default_draw.animation_music_fade_out',
                labels: {
                  'zh-CN': '动画音乐淡出',
                  'en-US': 'Animation music fade-out',
                  'ja-JP': 'アニメーション音楽のフェードアウト',
                },
                descriptions: {
                  'zh-CN': '动画音乐停止播放时的渐出时间（毫秒）',
                  'en-US': 'Fade-out time of the animation music, in milliseconds',
                  'ja-JP': 'アニメーション音楽の停止時のフェードアウト時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'default_draw.result_music_fade_in',
                labels: { 'zh-CN': '结果音乐淡入', 'en-US': 'Result music fade-in', 'ja-JP': '結果音楽のフェードイン' },
                descriptions: {
                  'zh-CN': '结果音乐开始播放时的渐入时间（毫秒）',
                  'en-US': 'Fade-in time of the result music, in milliseconds',
                  'ja-JP': '結果音楽の再生開始時のフェードイン時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'default_draw.result_music_fade_out',
                labels: {
                  'zh-CN': '结果音乐淡出',
                  'en-US': 'Result music fade-out',
                  'ja-JP': '結果音楽のフェードアウト',
                },
                descriptions: {
                  'zh-CN': '结果音乐停止播放时的渐出时间（毫秒）',
                  'en-US': 'Fade-out time of the result music, in milliseconds',
                  'ja-JP': '結果音楽の停止時のフェードアウト時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'default_draw.result_music',
                labels: { 'zh-CN': '结果音乐', 'en-US': 'Result Music', 'ja-JP': '結果音楽' },
                descriptions: {
                  'zh-CN': '选择抽取结果出现时使用的音乐',
                  'en-US': 'Music used when the draw result appears',
                  'ja-JP': '抽選結果の表示時に再生する音楽',
                },
                icon: 'Speaker2Filled',
                control: 'text',
                
                readonly: true,
              },
            ],
          },
        ],
      },
      {
        id: 'voiceAnnouncement',
        title: '语音播报',
        icon: 'PersonVoiceFilled',
        rows: [
          {
            path: 'default_draw.voice_announcement_enabled',
            labels: {
              'zh-CN': '启用语音播报',
              'en-US': 'Enable Voice Announcement',
              'ja-JP': '音声案内を有効化',
            },
            descriptions: {
              'zh-CN': '抽取完成后播报结果；全局语音播报开关关闭时，此设置不会生效',
              'en-US': 'Announce results after a draw; ineffective when global voice announcements are disabled',
              'ja-JP': '抽選後に結果を読み上げ、全体の音声案内が無効の場合は機能しません',
            },
            icon: 'PersonVoiceFilled',
            control: 'toggle',
          },
        ],
      },
      {
        id: 'reminder',
        title: '提示语设置',
        icon: 'TextFontFilled',
        rows: [
          {
            path: 'default_draw.reminder_text',
            labels: { 'zh-CN': '提示语', 'en-US': 'Reminder Text', 'ja-JP': 'リマインダー' },
            descriptions: {
              'zh-CN': '抽取页结果区域旁显示的提示文字',
              'en-US': 'Text shown beside the result area on draw pages',
              'ja-JP': '抽選ページの結果欄の横に表示する文字',
            },
            icon: 'TextFontFilled',
            control: 'text',
          },
          {
            path: 'default_draw.reminder_font_size',
            labels: { 'zh-CN': '提示语字体大小', 'en-US': 'Reminder Font Size', 'ja-JP': 'リマインダーの文字サイズ' },
            descriptions: {
              'zh-CN': '提示语文字大小',
              'en-US': 'Reminder text size',
              'ja-JP': 'リマインダーの文字サイズ',
            },
            icon: 'TextFontFilled',
            control: 'number',
          },
          {
            path: 'default_draw.reminder_text_opacity',
            labels: { 'zh-CN': '提示语透明度', 'en-US': 'Reminder Opacity', 'ja-JP': 'リマインダーの不透明度' },
            descriptions: {
              'zh-CN': '提示语文字透明度（0-100）',
              'en-US': 'Reminder text opacity (0-100)',
              'ja-JP': 'リマインダーの不透明度（0-100）',
            },
            icon: 'SlidePlayFilled',
            control: 'number',
          },
        ],
      },
    ],
  },
  {
    id: 'roll_call',
    title: '点名抽取设置',
    groupId: 'picking',
    icon: 'PersonFilled',
    sections: [
      {
        id: 'draw',
        title: '抽取设置',
        icon: 'FlashFilled',
        rows: [
          {
            path: 'roll_call.draw_mode',
            labels: { 'zh-CN': '抽取模式', 'en-US': 'Draw Mode', 'ja-JP': '抽選モード' },
            descriptions: {
              'zh-CN': '控制重复抽取记录的处理方式',
              'en-US': 'Controls how repeated draw records are handled',
              'ja-JP': '重複する抽選記録の扱いを指定します',
            },
            icon: 'FlashFilled',
            control: 'select',
            options: ['Repeat', 'NoRepeat', 'HalfRepeat'],
          },
          {
            path: 'roll_call.half_repeat',
            visibleWhen: { all: [{ path: 'roll_call.draw_mode', equals: 'HalfRepeat' }] },
            labels: { 'zh-CN': '半重复阈值', 'en-US': 'Half-repeat Threshold', 'ja-JP': '半重複のしきい値' },
            descriptions: {
              'zh-CN': '抽中次数达到该值后不会再次进入候选池',
              'en-US': 'After this number of draws, the item will not re-enter the candidate pool',
              'ja-JP': 'この回数抽選された項目は候補に戻りません',
            },
            icon: 'ClipboardBulletListFilled',
            control: 'number',
          },
          {
            












            path: 'roll_call.algorithm_id',
            labels: { 'zh-CN': '点名算法' },
            descriptions: { 'zh-CN': '选择用于生成成员候选池的算法' },
            icon: 'FlashFilled',
            control: 'select',
            options: [
              { value: 'builtin.fair', labels: { 'zh-CN': '公平抽取' } },
              { value: 'builtin.random', labels: { 'zh-CN': '随机抽取' } },
            ],
          },
          {
            
            path: 'roll_call.default_class',
            labels: { 'zh-CN': '默认抽取名单', 'en-US': 'Default Member List', 'ja-JP': '既定のメンバーリスト' },
            descriptions: {
              'zh-CN': '打开页面或执行闪抽时默认使用的名单',
              'en-US': 'The list used by default when opening a page or running Quick Draw',
              'ja-JP': 'ページを開くとき、またはクイック抽選時に使う名簿',
            },
            icon: 'PeopleListFilled',
            control: 'text',
            readonly: true,
          },
          {
            path: 'roll_call.clear_record',
            labels: { 'zh-CN': '清除记录', 'en-US': 'Clear Records', 'ja-JP': '記録を消去' },
            descriptions: {
              'zh-CN': '控制抽取记录何时清除',
              'en-US': 'Controls when draw records are cleared',
              'ja-JP': '抽選記録を消去するタイミングを指定します',
            },
            icon: 'HistoryFilled',
            control: 'select',
            options: ['Restarted', 'Cleared'],
          },
        ],
      },
      {
        id: 'overridable',
        title: '可覆盖设置',
        icon: 'SettingsFilled',
        rows: [
          {
            path: 'roll_call.override_display_settings',
            labels: {
              'zh-CN': '覆盖显示设置',
              'en-US': 'Override display settings',
              'ja-JP': '表示設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的显示设置，而不是默认抽取设置',
              'en-US': 'This page uses its own display settings instead of the default draw settings',
              'ja-JP': 'このページ独自の表示設定を使い、既定の抽選設定は使いません',
            },
            icon: 'TextFontFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'roll_call.use_global_font',
                labels: { 'zh-CN': '字体来源', 'en-US': 'Font Source', 'ja-JP': 'フォントの指定元' },
                descriptions: {
                  'zh-CN': '跟随全局字体或为抽取结果单独指定字体',
                  'en-US': 'Follow the global font or specify a font for draw results',
                  'ja-JP': '全体設定に従うか、抽選結果専用のフォントを指定します',
                },
                icon: 'TextFontFilled',
                control: 'select',
                options: ['FollowGlobal', 'Custom'],
                
                
                
                readonly: true,
              },
              {
            
                path: 'roll_call.custom_font',
                visibleWhen: { all: [{ path: 'roll_call.use_global_font', equals: 'Custom' }] },
                labels: { 'zh-CN': '自定义字体', 'en-US': 'Custom Font', 'ja-JP': 'カスタムフォント' },
                descriptions: {
                  'zh-CN': '字体族名称，留空时使用默认字体',
                  'en-US': 'Font family name; leave empty to use the default font',
                  'ja-JP': 'フォントファミリー名を指定し、空欄の場合は既定のフォントを使用します',
                },
                icon: 'TextFontFilled',
                control: 'text',
            readonly: true,
              },
              {
                path: 'roll_call.font_size',
                labels: { 'zh-CN': '字体大小', 'en-US': 'Font Size', 'ja-JP': 'フォントサイズ' },
                descriptions: {
                  'zh-CN': '抽取结果文字大小',
                  'en-US': 'Text size for draw results',
                  'ja-JP': '抽選結果の文字サイズ',
                },
                icon: 'TextFontFilled',
                control: 'number',
              },
              {
                path: 'roll_call.display_format',
                labels: { 'zh-CN': '显示格式', 'en-US': 'Display Format', 'ja-JP': '表示形式' },
                descriptions: {
                  'zh-CN': '控制结果中显示名称、编号或两者',
                  'en-US': 'Choose whether results show names, numbers, or both',
                  'ja-JP': '結果に名称、番号、または両方を表示するか指定します',
                },
                icon: 'TextFontFilled',
                control: 'select',
                options: ['Both', 'Name', 'Id'],
              },
              {
                path: 'roll_call.display_style',
                labels: { 'zh-CN': '显示样式', 'en-US': 'Display Style', 'ja-JP': '表示スタイル' },
                descriptions: {
                  'zh-CN': '控制抽取结果的整体样式',
                  'en-US': 'Controls the overall style of draw results',
                  'ja-JP': '抽選結果全体のスタイルを指定します',
                },
                icon: 'TextFontFilled',
                control: 'select',
                options: ['Default', 'Card'],
              },
              {
                path: 'roll_call.show_tags',
                labels: { 'zh-CN': '显示标签', 'en-US': 'Show Tags', 'ja-JP': 'タグを表示' },
                descriptions: {
                  'zh-CN': '抽取结果中展示成员或奖品标签',
                  'en-US': 'Show member or prize tags in draw results',
                  'ja-JP': '抽選結果にメンバーまたは景品のタグを表示します',
                },
                icon: 'TextFontFilled',
                control: 'toggle',
              },
              {
                path: 'roll_call.show_weight_transparency',
                labels: { 'zh-CN': '权重透明化', 'en-US': 'Show Weight Transparency', 'ja-JP': '重みを表示' },
                descriptions: {
                  'zh-CN': '在结果展示中显示权重透明信息',
                  'en-US': 'Show weight information in the result display',
                  'ja-JP': '結果表示に重みの情報を表示します',
                },
                icon: 'TextFontFilled',
                control: 'toggle',
              },
            ],
          },
          {
            path: 'roll_call.override_animation_settings',
            labels: {
              'zh-CN': '覆盖动画设置',
              'en-US': 'Override animation settings',
              'ja-JP': 'アニメーション設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的动画设置，而不是默认抽取设置',
              'en-US': 'This page uses its own animation settings instead of the default draw settings',
              'ja-JP': 'このページ独自のアニメーション設定を使い、既定の抽選設定は使いません',
            },
            icon: 'FlashFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'roll_call.animation',
                labels: { 'zh-CN': '动画模式', 'en-US': 'Animation Mode', 'ja-JP': 'アニメーションモード' },
                descriptions: {
                  'zh-CN': '设置抽取动画播放方式',
                  'en-US': 'Set how the draw animation plays',
                  'ja-JP': '抽選アニメーションの再生方法',
                },
                icon: 'FlashFilled',
                control: 'select',
                options: ['ManualStop', 'AutoPlay', 'NoAnimation'],
              },
              {
                path: 'roll_call.animation_interval',
                visibleWhen: { all: [{ path: 'roll_call.animation', notEquals: 'NoAnimation' }] },
                labels: { 'zh-CN': '动画间隔', 'en-US': 'Animation Interval', 'ja-JP': 'アニメーション間隔' },
                descriptions: {
                  'zh-CN': '抽取动画每次切换的间隔（毫秒）',
                  'en-US': 'Interval between draw animation changes (milliseconds)',
                  'ja-JP': '抽選アニメーションの切り替え間隔（ミリ秒）',
                },
                icon: 'FlashFilled',
                control: 'number',
              },
              {
                path: 'roll_call.autoplay_count',
                visibleWhen: { all: [{ path: 'roll_call.animation', equals: 'AutoPlay' }] },
                labels: { 'zh-CN': '自动播放次数', 'en-US': 'Autoplay Count', 'ja-JP': '自動再生回数' },
                descriptions: {
                  'zh-CN': '自动播放模式下滚动候选结果的次数',
                  'en-US': 'Number of candidate result changes in autoplay mode',
                  'ja-JP': '自動再生時に候補結果を切り替える回数',
                },
                icon: 'FlashFilled',
                control: 'number',
              },
              {
                path: 'roll_call.animation_style',
                visibleWhen: { all: [{ path: 'roll_call.animation', notEquals: 'NoAnimation' }] },
                labels: { 'zh-CN': '动画样式', 'en-US': 'Animation Style', 'ja-JP': 'アニメーションスタイル' },
                descriptions: {
                  'zh-CN': '设置抽取过程和最终定格时使用的统一动画效果',
                  'en-US': 'Unified animation effect for the draw process and final result',
                  'ja-JP': '抽選中と最終結果に使用する統一アニメーション',
                },
                icon: 'FlashFilled',
                control: 'select',
                options: ['DirectRotate', 'FadeFloat', 'HorizontalShake'],
              },
            ],
          },
          {
            path: 'roll_call.override_color_settings',
            labels: { 'zh-CN': '覆盖颜色设置', 'en-US': 'Override color settings', 'ja-JP': '色設定を上書き' },
            descriptions: {
              'zh-CN': '本页使用自己的颜色设置，而不是默认抽取设置',
              'en-US': 'This page uses its own color settings instead of the default draw settings',
              'ja-JP': 'このページ独自の色設定を使い、既定の抽選設定は使いません',
            },
            icon: 'ColorFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'roll_call.animation_color_theme',
                labels: { 'zh-CN': '颜色主题', 'en-US': 'Color Theme', 'ja-JP': 'カラーテーマ' },
                descriptions: {
                  'zh-CN': '设置抽取动画和结果颜色来源',
                  'en-US': 'Set the source of colors for draw animations and results',
                  'ja-JP': '抽選アニメーションと結果の色の指定元',
                },
                icon: 'ColorFilled',
                control: 'select',
                options: ['None', 'Random', 'Fixed'],
              },
            ],
          },
          {
            path: 'roll_call.override_student_image_settings',
            labels: {
              'zh-CN': '覆盖头像设置',
              'en-US': 'Override member image settings',
              'ja-JP': 'メンバー画像設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的头像设置，而不是默认抽取设置',
              'en-US': 'This page uses its own member image settings instead of the default draw settings',
              'ja-JP': 'このページ独自のメンバー画像設定を使い、既定の抽選設定は使いません',
            },
            icon: 'ImageFilled',
            control: 'toggle',
            
            rows: [
              {
            
                path: 'roll_call.student_image',
                labels: { 'zh-CN': '显示头像', 'en-US': 'Show Member Images', 'ja-JP': '画像を表示' },
                descriptions: {
                  'zh-CN': '在抽取结果中显示成员头像',
                  'en-US': 'Show member images in draw results',
                  'ja-JP': '抽選結果にメンバー画像を表示します',
                },
                icon: 'ImageFilled',
                control: 'toggle',
            readonly: true,
              },
              {
                path: 'roll_call.student_image_position',
                labels: { 'zh-CN': '头像位置', 'en-US': 'Image Position', 'ja-JP': '画像の位置' },
                descriptions: {
                  'zh-CN': '成员头像相对文字的位置',
                  'en-US': 'Position of the member image relative to the text',
                  'ja-JP': '文字に対するメンバー画像の位置',
                },
                icon: 'ImageFilled',
                control: 'select',
                options: ['Left', 'Top', 'Right', 'Bottom'],
              },
              {
                
                path: 'roll_call.student_image_size',
                labels: { 'zh-CN': '头像大小', 'en-US': 'Image Size', 'ja-JP': '画像サイズ' },
                descriptions: {
                  'zh-CN': '抽取结果中头像的显示边长，单位为像素',
                  'en-US': 'Display edge length of member images in draw results, in pixels',
                  'ja-JP': '抽選結果に表示するメンバー画像の一辺の長さ（ピクセル）',
                },
                icon: 'ImageFilled',
                control: 'number',
              },
            ],
          },
          {
            path: 'roll_call.override_music_settings',
            labels: { 'zh-CN': '覆盖音乐设置', 'en-US': 'Override music settings', 'ja-JP': '音楽設定を上書き' },
            descriptions: {
              'zh-CN': '本页使用自己的音乐设置，而不是默认抽取设置',
              'en-US': 'This page uses its own music settings instead of the default draw settings',
              'ja-JP': 'このページ独自の音楽設定を使い、既定の抽選設定は使いません',
            },
            icon: 'Speaker2Filled',
            control: 'toggle',
            
            rows: [
              {
            
                path: 'roll_call.animation_music',
                labels: { 'zh-CN': '动画音乐', 'en-US': 'Animation Music', 'ja-JP': 'アニメーション音楽' },
                descriptions: {
                  'zh-CN': '选择抽取动画播放时使用的音乐',
                  'en-US': 'Music used while the draw animation plays',
                  'ja-JP': '抽選アニメーション中に再生する音楽',
                },
                icon: 'Speaker2Filled',
                control: 'text',
            readonly: true,
              },
              {
            
                path: 'roll_call.result_music',
                labels: { 'zh-CN': '结果音乐', 'en-US': 'Result Music', 'ja-JP': '結果音楽' },
                descriptions: {
                  'zh-CN': '选择抽取结果出现时使用的音乐',
                  'en-US': 'Music used when the draw result appears',
                  'ja-JP': '抽選結果の表示時に再生する音楽',
                },
                icon: 'Speaker2Filled',
                control: 'text',
            readonly: true,
              },
              {
                path: 'roll_call.animation_music_loop',
                labels: {
                  'zh-CN': '循环播放动画音乐',
                  'en-US': 'Loop Animation Music',
                  'ja-JP': 'アニメーション音楽をループ',
                },
                descriptions: {
                  'zh-CN': '动画持续期间重复播放动画音乐',
                  'en-US': 'Repeat animation music while the animation continues',
                  'ja-JP': 'アニメーション中に音楽を繰り返します',
                },
                icon: 'Speaker2Filled',
                control: 'toggle',
              },
              {
                path: 'roll_call.animation_music_volume',
                labels: {
                  'zh-CN': '动画音乐音量',
                  'en-US': 'Animation Music Volume',
                  'ja-JP': 'アニメーション音楽の音量',
                },
                descriptions: {
                  'zh-CN': '设置抽取动画音乐的音量',
                  'en-US': 'Set the animation music volume',
                  'ja-JP': 'アニメーション音楽の音量',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'roll_call.result_music_volume',
                labels: { 'zh-CN': '结果音乐音量', 'en-US': 'Result Music Volume', 'ja-JP': '結果音楽の音量' },
                descriptions: {
                  'zh-CN': '设置抽取结果音乐的音量',
                  'en-US': 'Set the result music volume',
                  'ja-JP': '結果音楽の音量',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'roll_call.animation_music_fade_in',
                labels: {
                  'zh-CN': '动画音乐淡入',
                  'en-US': 'Animation music fade-in',
                  'ja-JP': 'アニメーション音楽のフェードイン',
                },
                descriptions: {
                  'zh-CN': '动画音乐开始播放时的渐入时间（毫秒）',
                  'en-US': 'Fade-in time of the animation music, in milliseconds',
                  'ja-JP': 'アニメーション音楽の再生開始時のフェードイン時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'roll_call.animation_music_fade_out',
                labels: {
                  'zh-CN': '动画音乐淡出',
                  'en-US': 'Animation music fade-out',
                  'ja-JP': 'アニメーション音楽のフェードアウト',
                },
                descriptions: {
                  'zh-CN': '动画音乐停止播放时的渐出时间（毫秒）',
                  'en-US': 'Fade-out time of the animation music, in milliseconds',
                  'ja-JP': 'アニメーション音楽の停止時のフェードアウト時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'roll_call.result_music_fade_in',
                labels: { 'zh-CN': '结果音乐淡入', 'en-US': 'Result music fade-in', 'ja-JP': '結果音楽のフェードイン' },
                descriptions: {
                  'zh-CN': '结果音乐开始播放时的渐入时间（毫秒）',
                  'en-US': 'Fade-in time of the result music, in milliseconds',
                  'ja-JP': '結果音楽の再生開始時のフェードイン時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'roll_call.result_music_fade_out',
                labels: {
                  'zh-CN': '结果音乐淡出',
                  'en-US': 'Result music fade-out',
                  'ja-JP': '結果音楽のフェードアウト',
                },
                descriptions: {
                  'zh-CN': '结果音乐停止播放时的渐出时间（毫秒）',
                  'en-US': 'Fade-out time of the result music, in milliseconds',
                  'ja-JP': '結果音楽の停止時のフェードアウト時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
            ],
          },
          {
            path: 'roll_call.override_voice_announcement_settings',
            labels: {
              'zh-CN': '覆盖语音播报设置',
              'en-US': 'Override voice announcement settings',
              'ja-JP': '音声読み上げ設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的语音播报设置，而不是默认抽取设置',
              'en-US': 'This page uses its own voice announcement settings instead of the default draw settings',
              'ja-JP': 'このページ独自の読み上げ設定を使い、既定の抽選設定は使いません',
            },
            icon: 'PersonVoiceFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'roll_call.voice_announcement_enabled',
                labels: {
                  'zh-CN': '启用语音播报',
                  'en-US': 'Enable Voice Announcement',
                  'ja-JP': '音声案内を有効化',
                },
                descriptions: {
                  'zh-CN': '抽取完成后播报结果；全局语音播报开关关闭时，此设置不会生效',
                  'en-US': 'Announce results after a draw; ineffective when global voice announcements are disabled',
                  'ja-JP': '抽選後に結果を読み上げ、全体の音声案内が無効の場合は機能しません',
                },
                icon: 'PersonVoiceFilled',
                control: 'toggle',
              },
            ],
          },
          {
            path: 'roll_call.override_reminder_settings',
            labels: {
              'zh-CN': '覆盖提示语设置',
              'en-US': 'Override reminder settings',
              'ja-JP': 'ヒント表示設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的提示语设置，而不是默认抽取设置',
              'en-US': 'This page uses its own reminder settings instead of the default draw settings',
              'ja-JP': 'このページ独自のヒント表示設定を使い、既定の抽選設定は使いません',
            },
            icon: 'TextFontFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'roll_call.reminder_text',
                labels: { 'zh-CN': '提示语', 'en-US': 'Reminder Text', 'ja-JP': 'リマインダー' },
                descriptions: {
                  'zh-CN': '抽取页结果区域旁显示的提示文字',
                  'en-US': 'Text shown beside the result area on draw pages',
                  'ja-JP': '抽選ページの結果欄の横に表示する文字',
                },
                icon: 'TextFontFilled',
                control: 'text',
              },
              {
                path: 'roll_call.reminder_font_size',
                labels: { 'zh-CN': '提示语字体大小', 'en-US': 'Reminder Font Size', 'ja-JP': 'リマインダーの文字サイズ' },
                descriptions: {
                  'zh-CN': '提示语文字大小',
                  'en-US': 'Reminder text size',
                  'ja-JP': 'リマインダーの文字サイズ',
                },
                icon: 'TextFontFilled',
                control: 'number',
              },
              {
                path: 'roll_call.reminder_text_opacity',
                labels: { 'zh-CN': '提示语透明度', 'en-US': 'Reminder Opacity', 'ja-JP': 'リマインダーの不透明度' },
                descriptions: {
                  'zh-CN': '提示语文字透明度（0-100）',
                  'en-US': 'Reminder text opacity (0-100)',
                  'ja-JP': 'リマインダーの不透明度（0-100）',
                },
                icon: 'TextFontFilled',
                control: 'number',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'quick_draw',
    title: '闪抽抽取设置',
    groupId: 'picking',
    icon: 'FlashFilled',
    sections: [
      {
        id: 'draw',
        title: '抽取设置',
        icon: 'FlashFilled',
        rows: [
          {
            path: 'quick_draw.draw_mode',
            labels: { 'zh-CN': '抽取模式', 'en-US': 'Draw Mode', 'ja-JP': '抽選モード' },
            descriptions: {
              'zh-CN': '控制重复抽取记录的处理方式',
              'en-US': 'Controls how repeated draw records are handled',
              'ja-JP': '重複する抽選記録の扱いを指定します',
            },
            icon: 'FlashFilled',
            control: 'select',
            options: ['Repeat', 'NoRepeat', 'HalfRepeat'],
          },
          {
            path: 'quick_draw.half_repeat',
            visibleWhen: { all: [{ path: 'quick_draw.draw_mode', equals: 'HalfRepeat' }] },
            labels: { 'zh-CN': '半重复阈值', 'en-US': 'Half-repeat Threshold', 'ja-JP': '半重複のしきい値' },
            descriptions: {
              'zh-CN': '抽中次数达到该值后不会再次进入候选池',
              'en-US': 'After this number of draws, the item will not re-enter the candidate pool',
              'ja-JP': 'この回数抽選された項目は候補に戻りません',
            },
            icon: 'ClipboardBulletListFilled',
            control: 'number',
          },
          {
            
            path: 'quick_draw.algorithm_id',
            labels: { 'zh-CN': '点名算法' },
            descriptions: { 'zh-CN': '选择闪抽使用的点名算法' },
            icon: 'FlashFilled',
            control: 'select',
            options: [
              { value: 'builtin.fair', labels: { 'zh-CN': '公平抽取' } },
              { value: 'builtin.random', labels: { 'zh-CN': '随机抽取' } },
            ],
          },
          {
            
            path: 'quick_draw.default_class',
            labels: { 'zh-CN': '默认抽取名单', 'en-US': 'Default Member List', 'ja-JP': '既定のメンバーリスト' },
            descriptions: {
              'zh-CN': '打开页面或执行闪抽时默认使用的名单',
              'en-US': 'The list used by default when opening a page or running Quick Draw',
              'ja-JP': 'ページを開くとき、またはクイック抽選時に使う名簿',
            },
            icon: 'PeopleListFilled',
            control: 'text',
            readonly: true,
          },
          {
            path: 'quick_draw.disable_after_click',
            labels: { 'zh-CN': '点击后禁用时间', 'en-US': 'Disable After Click', 'ja-JP': 'クリック後の無効時間' },
            descriptions: {
              'zh-CN': '点击一次闪抽后禁用按钮的秒数',
              'en-US': 'Seconds to disable the button after a Quick Draw',
              'ja-JP': 'クイック抽選後にボタンを無効にする秒数',
            },
            icon: 'TimerFilled',
            control: 'number',
          },
        ],
      },
      {
        id: 'overridable',
        title: '可覆盖设置',
        icon: 'SettingsFilled',
        rows: [
          {
            path: 'quick_draw.override_display_settings',
            labels: {
              'zh-CN': '覆盖显示设置',
              'en-US': 'Override display settings',
              'ja-JP': '表示設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的显示设置，而不是默认抽取设置',
              'en-US': 'This page uses its own display settings instead of the default draw settings',
              'ja-JP': 'このページ独自の表示設定を使い、既定の抽選設定は使いません',
            },
            icon: 'TextFontFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'quick_draw.use_global_font',
                labels: { 'zh-CN': '字体来源', 'en-US': 'Font Source', 'ja-JP': 'フォントの指定元' },
                descriptions: {
                  'zh-CN': '跟随全局字体或为抽取结果单独指定字体',
                  'en-US': 'Follow the global font or specify a font for draw results',
                  'ja-JP': '全体設定に従うか、抽選結果専用のフォントを指定します',
                },
                icon: 'TextFontFilled',
                control: 'select',
                options: ['FollowGlobal', 'Custom'],
                
                readonly: true,
              },
              {
            
                path: 'quick_draw.custom_font',
                visibleWhen: { all: [{ path: 'quick_draw.use_global_font', equals: 'Custom' }] },
                labels: { 'zh-CN': '自定义字体', 'en-US': 'Custom Font', 'ja-JP': 'カスタムフォント' },
                descriptions: {
                  'zh-CN': '字体族名称，留空时使用默认字体',
                  'en-US': 'Font family name; leave empty to use the default font',
                  'ja-JP': 'フォントファミリー名を指定し、空欄の場合は既定のフォントを使用します',
                },
                icon: 'TextFontFilled',
                control: 'text',
            readonly: true,
              },
              {
                path: 'quick_draw.font_size',
                labels: { 'zh-CN': '字体大小', 'en-US': 'Font Size', 'ja-JP': 'フォントサイズ' },
                descriptions: {
                  'zh-CN': '抽取结果文字大小',
                  'en-US': 'Text size for draw results',
                  'ja-JP': '抽選結果の文字サイズ',
                },
                icon: 'TextFontFilled',
                control: 'number',
              },
              {
                path: 'quick_draw.display_format',
                labels: { 'zh-CN': '显示格式', 'en-US': 'Display Format', 'ja-JP': '表示形式' },
                descriptions: {
                  'zh-CN': '控制结果中显示名称、编号或两者',
                  'en-US': 'Choose whether results show names, numbers, or both',
                  'ja-JP': '結果に名称、番号、または両方を表示するか指定します',
                },
                icon: 'TextFontFilled',
                control: 'select',
                options: ['Both', 'Name', 'Id'],
              },
              {
                path: 'quick_draw.show_tags',
                labels: { 'zh-CN': '显示标签', 'en-US': 'Show Tags', 'ja-JP': 'タグを表示' },
                descriptions: {
                  'zh-CN': '抽取结果中展示成员或奖品标签',
                  'en-US': 'Show member or prize tags in draw results',
                  'ja-JP': '抽選結果にメンバーまたは景品のタグを表示します',
                },
                icon: 'TextFontFilled',
                control: 'toggle',
              },
            ],
          },
          {
            path: 'quick_draw.override_animation_settings',
            labels: {
              'zh-CN': '覆盖动画设置',
              'en-US': 'Override animation settings',
              'ja-JP': 'アニメーション設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的动画设置，而不是默认抽取设置',
              'en-US': 'This page uses its own animation settings instead of the default draw settings',
              'ja-JP': 'このページ独自のアニメーション設定を使い、既定の抽選設定は使いません',
            },
            icon: 'FlashFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'quick_draw.animation',
                labels: { 'zh-CN': '动画模式', 'en-US': 'Animation Mode', 'ja-JP': 'アニメーションモード' },
                descriptions: {
                  'zh-CN': '设置抽取动画播放方式',
                  'en-US': 'Set how the draw animation plays',
                  'ja-JP': '抽選アニメーションの再生方法',
                },
                icon: 'FlashFilled',
                control: 'select',
                options: ['ManualStop', 'AutoPlay', 'NoAnimation'],
              },
              {
                path: 'quick_draw.animation_interval',
                visibleWhen: { all: [{ path: 'quick_draw.animation', notEquals: 'NoAnimation' }] },
                labels: { 'zh-CN': '动画间隔', 'en-US': 'Animation Interval', 'ja-JP': 'アニメーション間隔' },
                descriptions: {
                  'zh-CN': '抽取动画每次切换的间隔（毫秒）',
                  'en-US': 'Interval between draw animation changes (milliseconds)',
                  'ja-JP': '抽選アニメーションの切り替え間隔（ミリ秒）',
                },
                icon: 'FlashFilled',
                control: 'number',
              },
              {
                path: 'quick_draw.autoplay_count',
                visibleWhen: { all: [{ path: 'quick_draw.animation', equals: 'AutoPlay' }] },
                labels: { 'zh-CN': '自动播放次数', 'en-US': 'Autoplay Count', 'ja-JP': '自動再生回数' },
                descriptions: {
                  'zh-CN': '自动播放模式下滚动候选结果的次数',
                  'en-US': 'Number of candidate result changes in autoplay mode',
                  'ja-JP': '自動再生時に候補結果を切り替える回数',
                },
                icon: 'FlashFilled',
                control: 'number',
              },
              {
                path: 'quick_draw.animation_style',
                visibleWhen: { all: [{ path: 'quick_draw.animation', notEquals: 'NoAnimation' }] },
                labels: { 'zh-CN': '动画样式', 'en-US': 'Animation Style', 'ja-JP': 'アニメーションスタイル' },
                descriptions: {
                  'zh-CN': '设置抽取过程和最终定格时使用的统一动画效果',
                  'en-US': 'Unified animation effect for the draw process and final result',
                  'ja-JP': '抽選中と最終結果に使用する統一アニメーション',
                },
                icon: 'FlashFilled',
                control: 'select',
                options: ['DirectRotate', 'FadeFloat', 'HorizontalShake'],
              },
            ],
          },
          {
            path: 'quick_draw.override_color_settings',
            labels: { 'zh-CN': '覆盖颜色设置', 'en-US': 'Override color settings', 'ja-JP': '色設定を上書き' },
            descriptions: {
              'zh-CN': '本页使用自己的颜色设置，而不是默认抽取设置',
              'en-US': 'This page uses its own color settings instead of the default draw settings',
              'ja-JP': 'このページ独自の色設定を使い、既定の抽選設定は使いません',
            },
            icon: 'ColorFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'quick_draw.animation_color_theme',
                labels: { 'zh-CN': '颜色主题', 'en-US': 'Color Theme', 'ja-JP': 'カラーテーマ' },
                descriptions: {
                  'zh-CN': '设置抽取动画和结果颜色来源',
                  'en-US': 'Set the source of colors for draw animations and results',
                  'ja-JP': '抽選アニメーションと結果の色の指定元',
                },
                icon: 'ColorFilled',
                control: 'select',
                options: ['None', 'Random', 'Fixed'],
              },
            ],
          },
          {
            path: 'quick_draw.override_student_image_settings',
            labels: {
              'zh-CN': '覆盖头像设置',
              'en-US': 'Override member image settings',
              'ja-JP': 'メンバー画像設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的头像设置，而不是默认抽取设置',
              'en-US': 'This page uses its own member image settings instead of the default draw settings',
              'ja-JP': 'このページ独自のメンバー画像設定を使い、既定の抽選設定は使いません',
            },
            icon: 'ImageFilled',
            control: 'toggle',
            
            rows: [
              {
            
                path: 'quick_draw.student_image',
                labels: { 'zh-CN': '显示头像', 'en-US': 'Show Member Images', 'ja-JP': '画像を表示' },
                descriptions: {
                  'zh-CN': '在抽取结果中显示成员头像',
                  'en-US': 'Show member images in draw results',
                  'ja-JP': '抽選結果にメンバー画像を表示します',
                },
                icon: 'ImageFilled',
                control: 'toggle',
            readonly: true,
              },
              {
                path: 'quick_draw.student_image_position',
                labels: { 'zh-CN': '头像位置', 'en-US': 'Image Position', 'ja-JP': '画像の位置' },
                descriptions: {
                  'zh-CN': '成员头像相对文字的位置',
                  'en-US': 'Position of the member image relative to the text',
                  'ja-JP': '文字に対するメンバー画像の位置',
                },
                icon: 'ImageFilled',
                control: 'select',
                options: ['Left', 'Top', 'Right', 'Bottom'],
              },
              {
                
                path: 'quick_draw.student_image_size',
                labels: { 'zh-CN': '头像大小', 'en-US': 'Image Size', 'ja-JP': '画像サイズ' },
                descriptions: {
                  'zh-CN': '抽取结果中头像的显示边长，单位为像素',
                  'en-US': 'Display edge length of member images in draw results, in pixels',
                  'ja-JP': '抽選結果に表示するメンバー画像の一辺の長さ（ピクセル）',
                },
                icon: 'ImageFilled',
                control: 'number',
              },
            ],
          },
          {
            path: 'quick_draw.override_music_settings',
            labels: { 'zh-CN': '覆盖音乐设置', 'en-US': 'Override music settings', 'ja-JP': '音楽設定を上書き' },
            descriptions: {
              'zh-CN': '本页使用自己的音乐设置，而不是默认抽取设置',
              'en-US': 'This page uses its own music settings instead of the default draw settings',
              'ja-JP': 'このページ独自の音楽設定を使い、既定の抽選設定は使いません',
            },
            icon: 'Speaker2Filled',
            control: 'toggle',
            
            rows: [
              {
            
                path: 'quick_draw.animation_music',
                labels: { 'zh-CN': '动画音乐', 'en-US': 'Animation Music', 'ja-JP': 'アニメーション音楽' },
                descriptions: {
                  'zh-CN': '选择抽取动画播放时使用的音乐',
                  'en-US': 'Music used while the draw animation plays',
                  'ja-JP': '抽選アニメーション中に再生する音楽',
                },
                icon: 'Speaker2Filled',
                control: 'text',
            readonly: true,
              },
              {
            
                path: 'quick_draw.result_music',
                labels: { 'zh-CN': '结果音乐', 'en-US': 'Result Music', 'ja-JP': '結果音楽' },
                descriptions: {
                  'zh-CN': '选择抽取结果出现时使用的音乐',
                  'en-US': 'Music used when the draw result appears',
                  'ja-JP': '抽選結果の表示時に再生する音楽',
                },
                icon: 'Speaker2Filled',
                control: 'text',
            readonly: true,
              },
              {
                path: 'quick_draw.animation_music_loop',
                labels: {
                  'zh-CN': '循环播放动画音乐',
                  'en-US': 'Loop Animation Music',
                  'ja-JP': 'アニメーション音楽をループ',
                },
                descriptions: {
                  'zh-CN': '动画持续期间重复播放动画音乐',
                  'en-US': 'Repeat animation music while the animation continues',
                  'ja-JP': 'アニメーション中に音楽を繰り返します',
                },
                icon: 'Speaker2Filled',
                control: 'toggle',
              },
              {
                path: 'quick_draw.animation_music_volume',
                labels: {
                  'zh-CN': '动画音乐音量',
                  'en-US': 'Animation Music Volume',
                  'ja-JP': 'アニメーション音楽の音量',
                },
                descriptions: {
                  'zh-CN': '设置抽取动画音乐的音量',
                  'en-US': 'Set the animation music volume',
                  'ja-JP': 'アニメーション音楽の音量',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'quick_draw.result_music_volume',
                labels: { 'zh-CN': '结果音乐音量', 'en-US': 'Result Music Volume', 'ja-JP': '結果音楽の音量' },
                descriptions: {
                  'zh-CN': '设置抽取结果音乐的音量',
                  'en-US': 'Set the result music volume',
                  'ja-JP': '結果音楽の音量',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'quick_draw.animation_music_fade_in',
                labels: {
                  'zh-CN': '动画音乐淡入',
                  'en-US': 'Animation music fade-in',
                  'ja-JP': 'アニメーション音楽のフェードイン',
                },
                descriptions: {
                  'zh-CN': '动画音乐开始播放时的渐入时间（毫秒）',
                  'en-US': 'Fade-in time of the animation music, in milliseconds',
                  'ja-JP': 'アニメーション音楽の再生開始時のフェードイン時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'quick_draw.animation_music_fade_out',
                labels: {
                  'zh-CN': '动画音乐淡出',
                  'en-US': 'Animation music fade-out',
                  'ja-JP': 'アニメーション音楽のフェードアウト',
                },
                descriptions: {
                  'zh-CN': '动画音乐停止播放时的渐出时间（毫秒）',
                  'en-US': 'Fade-out time of the animation music, in milliseconds',
                  'ja-JP': 'アニメーション音楽の停止時のフェードアウト時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'quick_draw.result_music_fade_in',
                labels: { 'zh-CN': '结果音乐淡入', 'en-US': 'Result music fade-in', 'ja-JP': '結果音楽のフェードイン' },
                descriptions: {
                  'zh-CN': '结果音乐开始播放时的渐入时间（毫秒）',
                  'en-US': 'Fade-in time of the result music, in milliseconds',
                  'ja-JP': '結果音楽の再生開始時のフェードイン時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'quick_draw.result_music_fade_out',
                labels: {
                  'zh-CN': '结果音乐淡出',
                  'en-US': 'Result music fade-out',
                  'ja-JP': '結果音楽のフェードアウト',
                },
                descriptions: {
                  'zh-CN': '结果音乐停止播放时的渐出时间（毫秒）',
                  'en-US': 'Fade-out time of the result music, in milliseconds',
                  'ja-JP': '結果音楽の停止時のフェードアウト時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
            ],
          },
          {
            path: 'quick_draw.override_voice_announcement_settings',
            labels: {
              'zh-CN': '覆盖语音播报设置',
              'en-US': 'Override voice announcement settings',
              'ja-JP': '音声読み上げ設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的语音播报设置，而不是默认抽取设置',
              'en-US': 'This page uses its own voice announcement settings instead of the default draw settings',
              'ja-JP': 'このページ独自の読み上げ設定を使い、既定の抽選設定は使いません',
            },
            icon: 'PersonVoiceFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'quick_draw.voice_announcement_enabled',
                labels: {
                  'zh-CN': '启用语音播报',
                  'en-US': 'Enable Voice Announcement',
                  'ja-JP': '音声案内を有効化',
                },
                descriptions: {
                  'zh-CN': '抽取完成后播报结果；全局语音播报开关关闭时，此设置不会生效',
                  'en-US': 'Announce results after a draw; ineffective when global voice announcements are disabled',
                  'ja-JP': '抽選後に結果を読み上げ、全体の音声案内が無効の場合は機能しません',
                },
                icon: 'PersonVoiceFilled',
                control: 'toggle',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lottery',
    title: '抽奖抽取设置',
    groupId: 'picking',
    icon: 'LotteryFilled',
    sections: [
      {
        id: 'draw',
        title: '抽取设置',
        icon: 'FlashFilled',
        rows: [
          {
            path: 'lottery.draw_mode',
            labels: { 'zh-CN': '抽取模式', 'en-US': 'Draw Mode', 'ja-JP': '抽選モード' },
            descriptions: {
              'zh-CN': '控制重复抽取记录的处理方式',
              'en-US': 'Controls how repeated draw records are handled',
              'ja-JP': '重複する抽選記録の扱いを指定します',
            },
            icon: 'FlashFilled',
            control: 'select',
            options: ['Repeat', 'NoRepeat', 'HalfRepeat'],
          },
          {
            path: 'lottery.half_repeat',
            visibleWhen: { all: [{ path: 'lottery.draw_mode', equals: 'HalfRepeat' }] },
            labels: { 'zh-CN': '半重复阈值', 'en-US': 'Half-repeat Threshold', 'ja-JP': '半重複のしきい値' },
            descriptions: {
              'zh-CN': '抽中次数达到该值后不会再次进入候选池',
              'en-US': 'After this number of draws, the item will not re-enter the candidate pool',
              'ja-JP': 'この回数抽選された項目は候補に戻りません',
            },
            icon: 'ClipboardBulletListFilled',
            control: 'number',
          },
          {
            
            path: 'lottery.algorithm_id',
            labels: { 'zh-CN': '抽奖算法' },
            descriptions: { 'zh-CN': '选择用于生成奖品候选池的算法' },
            icon: 'FlashFilled',
            control: 'select',
            options: [
              { value: 'builtin.inventory', labels: { 'zh-CN': '按剩余数量' } },
              { value: 'builtin.weighted', labels: { 'zh-CN': '加权抽奖' } },
            ],
          },
          {
            
            path: 'lottery.default_pool',
            labels: { 'zh-CN': '默认抽奖名单', 'en-US': 'Default Prize Pool', 'ja-JP': '既定の景品プール' },
            descriptions: {
              'zh-CN': '打开抽奖页时默认使用的奖池',
              'en-US': 'The prize pool used by default when opening the lottery page',
              'ja-JP': 'くじ引きページを開くときに使う景品プール',
            },
            icon: 'LotteryFilled',
            control: 'text',
            readonly: true,
          },
          {
            path: 'lottery.clear_record',
            labels: { 'zh-CN': '清除记录', 'en-US': 'Clear Records', 'ja-JP': '記録を消去' },
            descriptions: {
              'zh-CN': '控制抽取记录何时清除',
              'en-US': 'Controls when draw records are cleared',
              'ja-JP': '抽選記録を消去するタイミングを指定します',
            },
            icon: 'HistoryFilled',
            control: 'select',
            options: ['Restarted', 'Cleared'],
          },
        ],
      },
      {
        id: 'overridable',
        title: '可覆盖设置',
        icon: 'SettingsFilled',
        rows: [
          {
            path: 'lottery.override_display_settings',
            labels: {
              'zh-CN': '覆盖显示设置',
              'en-US': 'Override display settings',
              'ja-JP': '表示設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的显示设置，而不是默认抽取设置',
              'en-US': 'This page uses its own display settings instead of the default draw settings',
              'ja-JP': 'このページ独自の表示設定を使い、既定の抽選設定は使いません',
            },
            icon: 'TextFontFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'lottery.use_global_font',
                labels: { 'zh-CN': '字体来源', 'en-US': 'Font Source', 'ja-JP': 'フォントの指定元' },
                descriptions: {
                  'zh-CN': '跟随全局字体或为抽取结果单独指定字体',
                  'en-US': 'Follow the global font or specify a font for draw results',
                  'ja-JP': '全体設定に従うか、抽選結果専用のフォントを指定します',
                },
                icon: 'TextFontFilled',
                control: 'select',
                options: ['FollowGlobal', 'Custom'],
                
                readonly: true,
              },
              {
            
                path: 'lottery.custom_font',
                visibleWhen: { all: [{ path: 'lottery.use_global_font', equals: 'Custom' }] },
                labels: { 'zh-CN': '自定义字体', 'en-US': 'Custom Font', 'ja-JP': 'カスタムフォント' },
                descriptions: {
                  'zh-CN': '字体族名称，留空时使用默认字体',
                  'en-US': 'Font family name; leave empty to use the default font',
                  'ja-JP': 'フォントファミリー名を指定し、空欄の場合は既定のフォントを使用します',
                },
                icon: 'TextFontFilled',
                control: 'text',
            readonly: true,
              },
              {
                path: 'lottery.font_size',
                labels: { 'zh-CN': '字体大小', 'en-US': 'Font Size', 'ja-JP': 'フォントサイズ' },
                descriptions: {
                  'zh-CN': '抽取结果文字大小',
                  'en-US': 'Text size for draw results',
                  'ja-JP': '抽選結果の文字サイズ',
                },
                icon: 'TextFontFilled',
                control: 'number',
              },
              {
                path: 'lottery.display_style',
                labels: { 'zh-CN': '显示样式', 'en-US': 'Display Style', 'ja-JP': '表示スタイル' },
                descriptions: {
                  'zh-CN': '控制抽取结果的整体样式',
                  'en-US': 'Controls the overall style of draw results',
                  'ja-JP': '抽選結果全体のスタイルを指定します',
                },
                icon: 'TextFontFilled',
                control: 'select',
                options: ['Default', 'Card'],
              },
              {
                path: 'lottery.lottery_show_random',
                labels: { 'zh-CN': '抽奖过程显示', 'en-US': 'Lottery Process Display', 'ja-JP': '抽選中の表示' },
                descriptions: {
                  'zh-CN': '抽奖过程中候选结果的展示格式',
                  'en-US': 'Display format for candidate results during the lottery',
                  'ja-JP': '抽選中に候補結果を表示する形式',
                },
                icon: 'TextFontFilled',
                control: 'select',
                options: ['PrizeIdPrizeBreakGroupHyphenMember', 'PrizeBreakGroupHyphenMember', 'PrizeHyphenMember', 'PrizeHyphenGroup', 'Custom'],
              },
              {
                path: 'lottery.custom_lottery_show_random_format',
                
                visibleWhen: { all: [{ path: 'lottery.lottery_show_random', equals: 'Custom' }] },
                labels: { 'zh-CN': '自定义显示格式' },
                descriptions: { 'zh-CN': '设置抽奖过程的自定义展示格式' },
                icon: 'TextFontFilled',
                control: 'text',
              },
              {
                path: 'lottery.show_tags',
                labels: { 'zh-CN': '显示标签', 'en-US': 'Show Tags', 'ja-JP': 'タグを表示' },
                descriptions: {
                  'zh-CN': '抽取结果中展示成员或奖品标签',
                  'en-US': 'Show member or prize tags in draw results',
                  'ja-JP': '抽選結果にメンバーまたは景品のタグを表示します',
                },
                icon: 'TextFontFilled',
                control: 'toggle',
              },
              {
                path: 'lottery.show_weight_transparency',
                labels: { 'zh-CN': '权重透明化', 'en-US': 'Show Weight Transparency', 'ja-JP': '重みを表示' },
                descriptions: {
                  'zh-CN': '在结果展示中显示权重透明信息',
                  'en-US': 'Show weight information in the result display',
                  'ja-JP': '結果表示に重みの情報を表示します',
                },
                icon: 'TextFontFilled',
                control: 'toggle',
              },
            ],
          },
          {
            path: 'lottery.override_animation_settings',
            labels: {
              'zh-CN': '覆盖动画设置',
              'en-US': 'Override animation settings',
              'ja-JP': 'アニメーション設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的动画设置，而不是默认抽取设置',
              'en-US': 'This page uses its own animation settings instead of the default draw settings',
              'ja-JP': 'このページ独自のアニメーション設定を使い、既定の抽選設定は使いません',
            },
            icon: 'FlashFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'lottery.animation',
                labels: { 'zh-CN': '动画模式', 'en-US': 'Animation Mode', 'ja-JP': 'アニメーションモード' },
                descriptions: {
                  'zh-CN': '设置抽取动画播放方式',
                  'en-US': 'Set how the draw animation plays',
                  'ja-JP': '抽選アニメーションの再生方法',
                },
                icon: 'FlashFilled',
                control: 'select',
                options: ['ManualStop', 'AutoPlay', 'NoAnimation'],
              },
              {
                path: 'lottery.animation_interval',
                visibleWhen: { all: [{ path: 'lottery.animation', notEquals: 'NoAnimation' }] },
                labels: { 'zh-CN': '动画间隔', 'en-US': 'Animation Interval', 'ja-JP': 'アニメーション間隔' },
                descriptions: {
                  'zh-CN': '抽取动画每次切换的间隔（毫秒）',
                  'en-US': 'Interval between draw animation changes (milliseconds)',
                  'ja-JP': '抽選アニメーションの切り替え間隔（ミリ秒）',
                },
                icon: 'FlashFilled',
                control: 'number',
              },
              {
                path: 'lottery.autoplay_count',
                visibleWhen: { all: [{ path: 'lottery.animation', equals: 'AutoPlay' }] },
                labels: { 'zh-CN': '自动播放次数', 'en-US': 'Autoplay Count', 'ja-JP': '自動再生回数' },
                descriptions: {
                  'zh-CN': '自动播放模式下滚动候选结果的次数',
                  'en-US': 'Number of candidate result changes in autoplay mode',
                  'ja-JP': '自動再生時に候補結果を切り替える回数',
                },
                icon: 'FlashFilled',
                control: 'number',
              },
              {
                path: 'lottery.animation_style',
                visibleWhen: { all: [{ path: 'lottery.animation', notEquals: 'NoAnimation' }] },
                labels: { 'zh-CN': '动画样式', 'en-US': 'Animation Style', 'ja-JP': 'アニメーションスタイル' },
                descriptions: {
                  'zh-CN': '设置抽取过程和最终定格时使用的统一动画效果',
                  'en-US': 'Unified animation effect for the draw process and final result',
                  'ja-JP': '抽選中と最終結果に使用する統一アニメーション',
                },
                icon: 'FlashFilled',
                control: 'select',
                options: ['DirectRotate', 'FadeFloat', 'HorizontalShake'],
              },
            ],
          },
          {
            path: 'lottery.override_color_settings',
            labels: { 'zh-CN': '覆盖颜色设置', 'en-US': 'Override color settings', 'ja-JP': '色設定を上書き' },
            descriptions: {
              'zh-CN': '本页使用自己的颜色设置，而不是默认抽取设置',
              'en-US': 'This page uses its own color settings instead of the default draw settings',
              'ja-JP': 'このページ独自の色設定を使い、既定の抽選設定は使いません',
            },
            icon: 'ColorFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'lottery.animation_color_theme',
                labels: { 'zh-CN': '颜色主题', 'en-US': 'Color Theme', 'ja-JP': 'カラーテーマ' },
                descriptions: {
                  'zh-CN': '设置抽取动画和结果颜色来源',
                  'en-US': 'Set the source of colors for draw animations and results',
                  'ja-JP': '抽選アニメーションと結果の色の指定元',
                },
                icon: 'ColorFilled',
                control: 'select',
                options: ['None', 'Random', 'Fixed'],
              },
            ],
          },
          {
            path: 'lottery.override_student_image_settings',
            labels: {
              'zh-CN': '覆盖头像设置',
              'en-US': 'Override member image settings',
              'ja-JP': 'メンバー画像設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的头像设置，而不是默认抽取设置',
              'en-US': 'This page uses its own member image settings instead of the default draw settings',
              'ja-JP': 'このページ独自のメンバー画像設定を使い、既定の抽選設定は使いません',
            },
            icon: 'ImageFilled',
            control: 'toggle',
            
            rows: [
              {
            
                path: 'lottery.lottery_image',
                labels: { 'zh-CN': '显示奖品图片', 'en-US': 'Show Prize Images', 'ja-JP': '景品画像を表示' },
                descriptions: {
                  'zh-CN': '在抽奖结果中显示奖品图片',
                  'en-US': 'Show prize images in lottery results',
                  'ja-JP': 'くじ引き結果に景品画像を表示します',
                },
                icon: 'ImageFilled',
                control: 'toggle',
            readonly: true,
              },
              {
                path: 'lottery.lottery_image_position',
                labels: { 'zh-CN': '奖品图片位置', 'en-US': 'Prize Image Position', 'ja-JP': '景品画像の位置' },
                descriptions: {
                  'zh-CN': '奖品图片相对文字的位置',
                  'en-US': 'Position of the prize image relative to the text',
                  'ja-JP': '文字に対する景品画像の位置',
                },
                icon: 'ImageFilled',
                control: 'select',
                options: ['Left', 'Top', 'Right', 'Bottom'],
              },
              {
                
                
                path: 'lottery.lottery_image_size',
                labels: { 'zh-CN': '奖品图片大小', 'en-US': 'Prize Image Size', 'ja-JP': '景品画像サイズ' },
                descriptions: {
                  'zh-CN': '抽奖结果中奖品图片的显示边长，单位为像素',
                  'en-US': 'Display edge length of prize images in draw results, in pixels',
                  'ja-JP': 'くじ引き結果に表示する景品画像の一辺の長さ（ピクセル）',
                },
                icon: 'ImageFilled',
                control: 'number',
              },
            ],
          },
          {
            path: 'lottery.override_music_settings',
            labels: { 'zh-CN': '覆盖音乐设置', 'en-US': 'Override music settings', 'ja-JP': '音楽設定を上書き' },
            descriptions: {
              'zh-CN': '本页使用自己的音乐设置，而不是默认抽取设置',
              'en-US': 'This page uses its own music settings instead of the default draw settings',
              'ja-JP': 'このページ独自の音楽設定を使い、既定の抽選設定は使いません',
            },
            icon: 'Speaker2Filled',
            control: 'toggle',
            
            rows: [
              {
            
                path: 'lottery.animation_music',
                labels: { 'zh-CN': '动画音乐', 'en-US': 'Animation Music', 'ja-JP': 'アニメーション音楽' },
                descriptions: {
                  'zh-CN': '选择抽取动画播放时使用的音乐',
                  'en-US': 'Music used while the draw animation plays',
                  'ja-JP': '抽選アニメーション中に再生する音楽',
                },
                icon: 'Speaker2Filled',
                control: 'text',
            readonly: true,
              },
              {
            
                path: 'lottery.result_music',
                labels: { 'zh-CN': '结果音乐', 'en-US': 'Result Music', 'ja-JP': '結果音楽' },
                descriptions: {
                  'zh-CN': '选择抽取结果出现时使用的音乐',
                  'en-US': 'Music used when the draw result appears',
                  'ja-JP': '抽選結果の表示時に再生する音楽',
                },
                icon: 'Speaker2Filled',
                control: 'text',
            readonly: true,
              },
              {
                path: 'lottery.animation_music_loop',
                labels: {
                  'zh-CN': '循环播放动画音乐',
                  'en-US': 'Loop Animation Music',
                  'ja-JP': 'アニメーション音楽をループ',
                },
                descriptions: {
                  'zh-CN': '动画持续期间重复播放动画音乐',
                  'en-US': 'Repeat animation music while the animation continues',
                  'ja-JP': 'アニメーション中に音楽を繰り返します',
                },
                icon: 'Speaker2Filled',
                control: 'toggle',
              },
              {
                path: 'lottery.animation_music_volume',
                labels: {
                  'zh-CN': '动画音乐音量',
                  'en-US': 'Animation Music Volume',
                  'ja-JP': 'アニメーション音楽の音量',
                },
                descriptions: {
                  'zh-CN': '设置抽取动画音乐的音量',
                  'en-US': 'Set the animation music volume',
                  'ja-JP': 'アニメーション音楽の音量',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'lottery.result_music_volume',
                labels: { 'zh-CN': '结果音乐音量', 'en-US': 'Result Music Volume', 'ja-JP': '結果音楽の音量' },
                descriptions: {
                  'zh-CN': '设置抽取结果音乐的音量',
                  'en-US': 'Set the result music volume',
                  'ja-JP': '結果音楽の音量',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'lottery.animation_music_fade_in',
                labels: {
                  'zh-CN': '动画音乐淡入',
                  'en-US': 'Animation music fade-in',
                  'ja-JP': 'アニメーション音楽のフェードイン',
                },
                descriptions: {
                  'zh-CN': '动画音乐开始播放时的渐入时间（毫秒）',
                  'en-US': 'Fade-in time of the animation music, in milliseconds',
                  'ja-JP': 'アニメーション音楽の再生開始時のフェードイン時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'lottery.animation_music_fade_out',
                labels: {
                  'zh-CN': '动画音乐淡出',
                  'en-US': 'Animation music fade-out',
                  'ja-JP': 'アニメーション音楽のフェードアウト',
                },
                descriptions: {
                  'zh-CN': '动画音乐停止播放时的渐出时间（毫秒）',
                  'en-US': 'Fade-out time of the animation music, in milliseconds',
                  'ja-JP': 'アニメーション音楽の停止時のフェードアウト時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'lottery.result_music_fade_in',
                labels: { 'zh-CN': '结果音乐淡入', 'en-US': 'Result music fade-in', 'ja-JP': '結果音楽のフェードイン' },
                descriptions: {
                  'zh-CN': '结果音乐开始播放时的渐入时间（毫秒）',
                  'en-US': 'Fade-in time of the result music, in milliseconds',
                  'ja-JP': '結果音楽の再生開始時のフェードイン時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
              {
                path: 'lottery.result_music_fade_out',
                labels: {
                  'zh-CN': '结果音乐淡出',
                  'en-US': 'Result music fade-out',
                  'ja-JP': '結果音楽のフェードアウト',
                },
                descriptions: {
                  'zh-CN': '结果音乐停止播放时的渐出时间（毫秒）',
                  'en-US': 'Fade-out time of the result music, in milliseconds',
                  'ja-JP': '結果音楽の停止時のフェードアウト時間（ミリ秒）',
                },
                icon: 'Speaker2Filled',
                control: 'number',
              },
            ],
          },
          {
            path: 'lottery.override_voice_announcement_settings',
            labels: {
              'zh-CN': '覆盖语音播报设置',
              'en-US': 'Override voice announcement settings',
              'ja-JP': '音声読み上げ設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的语音播报设置，而不是默认抽取设置',
              'en-US': 'This page uses its own voice announcement settings instead of the default draw settings',
              'ja-JP': 'このページ独自の読み上げ設定を使い、既定の抽選設定は使いません',
            },
            icon: 'PersonVoiceFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'lottery.voice_announcement_enabled',
                labels: {
                  'zh-CN': '启用语音播报',
                  'en-US': 'Enable Voice Announcement',
                  'ja-JP': '音声案内を有効化',
                },
                descriptions: {
                  'zh-CN': '抽取完成后播报结果；全局语音播报开关关闭时，此设置不会生效',
                  'en-US': 'Announce results after a draw; ineffective when global voice announcements are disabled',
                  'ja-JP': '抽選後に結果を読み上げ、全体の音声案内が無効の場合は機能しません',
                },
                icon: 'PersonVoiceFilled',
                control: 'toggle',
              },
            ],
          },
          {
            path: 'lottery.override_reminder_settings',
            labels: {
              'zh-CN': '覆盖提示语设置',
              'en-US': 'Override reminder settings',
              'ja-JP': 'ヒント表示設定を上書き',
            },
            descriptions: {
              'zh-CN': '本页使用自己的提示语设置，而不是默认抽取设置',
              'en-US': 'This page uses its own reminder settings instead of the default draw settings',
              'ja-JP': 'このページ独自のヒント表示設定を使い、既定の抽選設定は使いません',
            },
            icon: 'TextFontFilled',
            control: 'toggle',
            
            rows: [
              {
                path: 'lottery.reminder_text',
                labels: { 'zh-CN': '提示语', 'en-US': 'Reminder Text', 'ja-JP': 'リマインダー' },
                descriptions: {
                  'zh-CN': '抽取页结果区域旁显示的提示文字',
                  'en-US': 'Text shown beside the result area on draw pages',
                  'ja-JP': '抽選ページの結果欄の横に表示する文字',
                },
                icon: 'TextFontFilled',
                control: 'text',
              },
              {
                path: 'lottery.reminder_font_size',
                labels: { 'zh-CN': '提示语字体大小', 'en-US': 'Reminder Font Size', 'ja-JP': 'リマインダーの文字サイズ' },
                descriptions: {
                  'zh-CN': '提示语文字大小',
                  'en-US': 'Reminder text size',
                  'ja-JP': 'リマインダーの文字サイズ',
                },
                icon: 'TextFontFilled',
                control: 'number',
              },
              {
                path: 'lottery.reminder_text_opacity',
                labels: { 'zh-CN': '提示语透明度', 'en-US': 'Reminder Opacity', 'ja-JP': 'リマインダーの不透明度' },
                descriptions: {
                  'zh-CN': '提示语文字透明度（0-100）',
                  'en-US': 'Reminder text opacity (0-100)',
                  'ja-JP': 'リマインダーの不透明度（0-100）',
                },
                icon: 'TextFontFilled',
                control: 'number',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'voice',
    title: '语音设置',
    groupId: 'notification',
    icon: 'PersonVoiceFilled',
    sections: [
      {
        id: 'playback',
        title: '语音播报',
        icon: 'PersonVoiceFilled',
        rows: [
          {
            path: 'voice.enable',
            labels: {
              'zh-CN': '启用语音播报',
              'en-US': 'Enable voice announcements',
              'ja-JP': '音声読み上げを有効化',
            },
            descriptions: {
              'zh-CN': '作为所有抽取语音播报的总开关；各抽取设置可单独控制是否播报',
              'en-US': 'Master switch for all draw announcements; each draw setting can control announcements separately',
              'ja-JP': 'すべての抽選読み上げのマスタースイッチで、各抽選設定で個別に制御できます',
            },
            icon: 'Speaker2Filled',
            control: 'toggle',
          },
          {
            path: 'voice.voice_engine',
            labels: { 'zh-CN': '语音引擎', 'en-US': 'Speech engine', 'ja-JP': '音声エンジン' },
            descriptions: {
              'zh-CN': '选择用于播报的语音引擎',
              'en-US': 'Select the speech engine used for announcements',
              'ja-JP': '読み上げに使用する音声エンジンを選択',
            },
            icon: 'PersonVoiceFilled',
            





            control: 'select',
            options: ['0', '1', '2'],
          },
          {
            








            kind: 'container',
            id: 'omniTts',
            labels: { 'zh-CN': 'Omni TTS 设置', 'en-US': 'Omni TTS Settings', 'ja-JP': 'Omni TTS 設定' },
            icon: 'GlobeFilled',
            visibleWhen: { all: [{ path: 'voice.voice_engine', equals: 2 }] },
            rows: [
              {
                path: 'voice.omni_tts_provider',
                labels: { 'zh-CN': '服务提供方', 'en-US': 'Service Provider', 'ja-JP': 'サービス提供元' },
                descriptions: {
                  'zh-CN': '选择 Omni TTS 使用的语音服务，模型与音色可自动获取或手动输入',
                  'en-US': 'Select the Omni TTS speech service; models and voices can be fetched or typed manually',
                  'ja-JP': 'Omni TTS で使用する音声サービスを選択、モデルと音声は自動取得または手動入力可能',
                },
                icon: 'GlobeFilled',
                control: 'select',
                options: ['OpenAi', 'FishAudio', 'MiMo', 'Gemini', 'Custom'],
              },
              {
                path: 'voice.omni_tts_api_base_url',
                labels: { 'zh-CN': 'API 接入地址', 'en-US': 'API Base URL', 'ja-JP': 'API ベース URL' },
                descriptions: {
                  'zh-CN': '服务提供方的 API 基础地址，切换提供方时自动填充',
                  'en-US': 'Base URL of the speech service, auto-filled when the provider changes',
                  'ja-JP': '音声サービスの API ベース URL、提供元を切り替えると自動入力',
                },
                icon: 'GlobeFilled',
                control: 'text',
              },
              {
                path: 'voice.omni_tts_model',
                labels: { 'zh-CN': '模型', 'en-US': 'Model', 'ja-JP': 'モデル' },
                descriptions: {
                  'zh-CN': '可点击获取从服务拉取的模型列表，也可直接手动输入模型名称',
                  'en-US': 'Fetch the model list from the service, or type a model name manually',
                  'ja-JP': 'サービスからモデル一覧を取得するか、モデル名を直接入力',
                },
                icon: 'GlobeFilled',
                control: 'text',
                





              },
              {
                path: 'voice.omni_tts_voice_id',
                labels: { 'zh-CN': '音色', 'en-US': 'Voice', 'ja-JP': '音声' },
                descriptions: {
                  'zh-CN': '音色 ID 或参考音色标识，可下拉选择或手动输入',
                  'en-US': 'Voice ID or reference voice, pick from the list or type manually',
                  'ja-JP': '音声 ID または参照音声、一覧から選択または手動入力',
                },
                icon: 'GlobeFilled',
                control: 'text',
                



              },
              {
                path: 'voice.mi_mo_voice_design_prompt',
                




                visibleWhen: {
                  all: [
                    { path: 'voice.voice_engine', equals: 2 },
                    { path: 'voice.omni_tts_provider', equals: 'MiMo' },
                    { path: 'voice.omni_tts_model', equals: 'mimo-v2.5-tts-voicedesign' },
                  ],
                },
                labels: { 'zh-CN': '音色描述', 'en-US': 'Voice description', 'ja-JP': '音声の説明' },
                descriptions: {
                  'zh-CN': '用于生成音色的描述；播报文本会自动作为合成内容发送',
                  'en-US': 'Describes the generated voice. The announcement text is sent automatically as synthesis content.',
                  'ja-JP': '生成する音声を説明します。読み上げる本文は合成内容として自動送信されます。',
                },
                icon: 'GlobeFilled',
                control: 'text',
              },
              {
                path: 'voice.mi_mo_voice_clone_reference_hash',
                
                visibleWhen: {
                  all: [
                    { path: 'voice.voice_engine', equals: 2 },
                    { path: 'voice.omni_tts_provider', equals: 'MiMo' },
                    { path: 'voice.omni_tts_model', equals: 'mimo-v2.5-tts-voiceclone' },
                  ],
                },
                labels: {
                  'zh-CN': '音色克隆参考音频',
                  'en-US': 'Voice clone reference',
                  'ja-JP': '音色クローンの参照音声',
                },
                descriptions: {
                  'zh-CN': '已配置参考音频的哈希；音频本身只保存在本机私有目录，不写入设置也不备份',
                  'en-US': 'Hash of the configured reference audio; the audio itself stays in a private local directory and is never written to settings or backups',
                  'ja-JP': '設定済み参照音声のハッシュ。音声ファイル自体は端末内の非公開ディレクトリにのみ保存され、設定やバックアップには含まれません',
                },
                icon: 'GlobeFilled',
                control: 'readonly',
              },
              {
                path: 'voice.omni_tts_instructions',
                labels: { 'zh-CN': '语气指令', 'en-US': 'Voice Instructions', 'ja-JP': '音声指示' },
                descriptions: {
                  'zh-CN': '仅部分模型支持（如 gpt-4o-mini-tts），用于引导播报语气',
                  'en-US': 'Supported only by some models such as gpt-4o-mini-tts to steer the speaking style',
                  'ja-JP': '一部モデルのみ対応（例 gpt-4o-mini-tts）、読み上げ口調の指定に使用',
                },
                icon: 'GlobeFilled',
                control: 'text',
              },
            ],
          },
          {
            path: 'voice.system_tts_voice_name',
            








            visibleWhen: { all: [{ path: 'voice.voice_engine', equals: 0 }] },
            labels: { 'zh-CN': '系统语音音色', 'en-US': 'System speech voice', 'ja-JP': 'システム音声' },
            descriptions: {
              'zh-CN': '选择 Windows 系统语音使用的音色',
              'en-US': 'Select the voice used by Windows system speech',
              'ja-JP': 'Windows システム音声で使用する音声を選択',
            },
            icon: 'MicFilled',
            control: 'text',
            
            
            readonly: true,
          },
          {
            path: 'voice.edge_tts_voice_name',
            
            visibleWhen: { all: [{ path: 'voice.voice_engine', equals: 1 }] },
            labels: { 'zh-CN': 'Edge TTS 音色', 'en-US': 'Edge TTS voice', 'ja-JP': 'Edge TTS 音声' },
            descriptions: {
              'zh-CN': '选择 Edge TTS 使用的音色',
              'en-US': 'Select the voice used by Edge TTS',
              'ja-JP': 'Edge TTS で使用する音声を選択',
            },
            icon: 'MicFilled',
            control: 'text',
            
            
            readonly: true,
          },
          {
            path: 'voice.volume',
            labels: { 'zh-CN': '语音音量', 'en-US': 'Voice volume', 'ja-JP': '音声音量' },
            descriptions: {
              'zh-CN': '设置播报音量',
              'en-US': 'Set announcement volume',
              'ja-JP': '読み上げ音量を設定',
            },
            icon: 'Speaker2Filled',
            control: 'number',
          },
          {
            path: 'voice.speech_rate',
            labels: { 'zh-CN': '语速', 'en-US': 'Speech rate', 'ja-JP': '読み上げ速度' },
            descriptions: {
              'zh-CN': '设置播报速度百分比',
              'en-US': 'Set the announcement speed percentage',
              'ja-JP': '読み上げ速度の割合を設定',
            },
            icon: 'TopSpeedFilled',
            control: 'number',
          },
          {
            path: 'voice.voice_wait_complete',
            labels: {
              'zh-CN': '等待播报完成',
              'en-US': 'Wait for announcement to finish',
              'ja-JP': '読み上げの完了を待つ',
            },
            descriptions: {
              'zh-CN': '等待当前语音播报完成后再允许下一次抽取',
              'en-US': 'Wait for the current announcement to finish before allowing another draw',
              'ja-JP': '現在の読み上げが完了するまで次の抽選を許可しない',
            },
            icon: 'TimerFilled',
            control: 'toggle',
          },
        ],
      },
      {
        id: 'content',
        title: '播报内容',
        icon: 'TextFontFilled',
        rows: [
          {
            path: 'voice.announce_id',
            labels: { 'zh-CN': '播报编号', 'en-US': 'Announce ID', 'ja-JP': 'ID を読み上げ' },
            descriptions: {
              'zh-CN': '结果中包含编号',
              'en-US': 'Include the ID in results',
              'ja-JP': '結果に ID を含める',
            },
            icon: 'TextFontFilled',
            control: 'toggle',
          },
          {
            path: 'voice.announce_name',
            labels: { 'zh-CN': '播报名称', 'en-US': 'Announce name', 'ja-JP': '名前を読み上げ' },
            descriptions: {
              'zh-CN': '结果中包含名称',
              'en-US': 'Include the name in results',
              'ja-JP': '結果に名前を含める',
            },
            icon: 'TextFontFilled',
            control: 'toggle',
          },
        ],
      },
    ],
  },
  {
    


































    id: 'notification',
    title: '通知设置',
    groupId: 'notification',
    icon: 'CommentNoteFilled',
    sections: [
      {
        














        id: 'default',
        title: '通知窗口',
        icon: 'WindowFilled',
        rows: [
          {
            
            
            
            kind: 'container',
            id: 'notificationService',
            labels: { 'zh-CN': '通知服务', 'en-US': 'Notification Service', 'ja-JP': '通知サービス' },
            icon: 'CommentNoteFilled',
            rows: [
              {
                path: 'notification.default.display_duration',
                labels: { 'zh-CN': '通知显示时长', 'en-US': 'Notification Display Duration', 'ja-JP': '通知の表示時間' },
                descriptions: {
                  'zh-CN': '设置通知服务显示结果的秒数',
                  'en-US': 'Number of seconds the notification service displays results',
                  'ja-JP': '通知サービスが結果を表示する秒数を設定します',
                },
                icon: 'TimePickerFilled',
                control: 'number',
              },
            ],
          },
        ],
      },
      {
        




        id: 'rollCallBasic',
        title: '基础设置',
        icon: 'SettingsFilled',
        rows: [
          {
            
            path: 'notification.roll_call.enabled',
            labels: { 'zh-CN': '启用点名通知', 'en-US': 'Enable Roll-call Notifications', 'ja-JP': '点呼通知を有効化' },
            descriptions: {
              'zh-CN': '点名完成后显示通知结果',
              'en-US': 'Show notification results after roll-call',
              'ja-JP': '点呼後に通知結果を表示します',
            },
            icon: 'CommentNoteFilled',
            control: 'toggle',
          },
        ],
      },
      {
        




        id: 'rollCallOverridable',
        title: '可覆盖设置',
        icon: 'SettingsFilled',
        rows: [
          {
            kind: 'container',
            id: 'notificationService',
            labels: { 'zh-CN': '通知服务', 'en-US': 'Notification Service', 'ja-JP': '通知サービス' },
            icon: 'CommentNoteFilled',
            rows: [
              {
                path: 'notification.roll_call.display_duration',
                labels: { 'zh-CN': '点名通知显示时长', 'en-US': 'Roll-call Notification Display Duration', 'ja-JP': '点呼通知の表示時間' },
                descriptions: {
                  'zh-CN': '设置通知服务显示点名结果的秒数',
                  'en-US': 'Number of seconds the notification service displays roll-call results',
                  'ja-JP': '通知サービスが点呼結果を表示する秒数を設定します',
                },
                icon: 'TimePickerFilled',
                control: 'number',
              },
            ],
          },
        ],
      },
      {
        




        id: 'quickDrawBasic',
        title: '基础设置',
        icon: 'SettingsFilled',
        rows: [
          {
            path: 'notification.quick_draw.enabled',
            labels: { 'zh-CN': '启用闪抽通知', 'en-US': 'Enable Quick Draw Notifications', 'ja-JP': 'クイック抽選通知を有効化' },
            descriptions: {
              'zh-CN': '快速抽取完成后显示通知结果',
              'en-US': 'Show notification results after Quick Draw',
              'ja-JP': 'クイック抽選後に通知結果を表示します',
            },
            icon: 'CommentNoteFilled',
            control: 'toggle',
          },
        ],
      },
      {
        
        id: 'quickDrawOverridable',
        title: '可覆盖设置',
        icon: 'SettingsFilled',
        rows: [
          {
            kind: 'container',
            id: 'notificationService',
            labels: { 'zh-CN': '通知服务', 'en-US': 'Notification Service', 'ja-JP': '通知サービス' },
            icon: 'CommentNoteFilled',
            rows: [
              {
                path: 'notification.quick_draw.display_duration',
                labels: { 'zh-CN': '闪抽通知显示时长', 'en-US': 'Quick Draw Notification Display Duration', 'ja-JP': 'クイック抽選通知の表示時間' },
                descriptions: {
                  'zh-CN': '设置通知服务显示闪抽结果的秒数',
                  'en-US': 'Number of seconds the notification service displays Quick Draw results',
                  'ja-JP': '通知サービスがクイック抽選結果を表示する秒数を設定します',
                },
                icon: 'TimePickerFilled',
                control: 'number',
              },
            ],
          },
        ],
      },
      {
        




        id: 'lotteryBasic',
        title: '基础设置',
        icon: 'SettingsFilled',
        rows: [
          {
            path: 'notification.lottery.enabled',
            labels: { 'zh-CN': '启用抽奖通知', 'en-US': 'Enable Lottery Notifications', 'ja-JP': 'くじ引き通知を有効化' },
            descriptions: {
              'zh-CN': '抽奖完成后显示通知结果',
              'en-US': 'Show notification results after the lottery',
              'ja-JP': 'くじ引き後に通知結果を表示します',
            },
            icon: 'CommentNoteFilled',
            control: 'toggle',
          },
        ],
      },
      {
        
        id: 'lotteryOverridable',
        title: '可覆盖设置',
        icon: 'SettingsFilled',
        rows: [
          {
            kind: 'container',
            id: 'notificationService',
            labels: { 'zh-CN': '通知服务', 'en-US': 'Notification Service', 'ja-JP': '通知サービス' },
            icon: 'CommentNoteFilled',
            rows: [
              {
                path: 'notification.lottery.display_duration',
                labels: { 'zh-CN': '抽奖通知显示时长', 'en-US': 'Lottery Notification Display Duration', 'ja-JP': 'くじ引き通知の表示時間' },
                descriptions: {
                  'zh-CN': '设置通知服务显示抽奖结果的秒数',
                  'en-US': 'Number of seconds the notification service displays lottery results',
                  'ja-JP': '通知サービスがくじ引き結果を表示する秒数を設定します',
                },
                icon: 'TimePickerFilled',
                control: 'number',
              },
            ],
          },
        ],
      },
    ],
  },
]











export const CLIENT_SETTINGS_PATHS_WITHOUT_ROW: readonly { path: string; reason: string }[] = [
  {
    path: 'roll_call.draw_type',
    reason: '客户端页面上没有这一行：它由「抽取方式」选中的算法反推同步（RollCallDrawSettingsPage.SynchronizeLegacyDrawType）。',
  },
  {
    path: 'quick_draw.draw_type',
    reason: '同 roll_call.draw_type：由算法 id 反推同步（QuickDrawSettingsPage.SynchronizeLegacyDrawType）。',
  },
  {
    path: 'lottery.draw_type',
    reason: '客户端页面上没有这一行：抽奖页在选中算法时顺手把它定成「按数量」或「按奖盘」（LotteryDrawSettingsPage）。',
  },
  {
    path: 'quick_draw.display_style',
    reason: '闪抽页的「显示设置」分组里没有「显示样式」行（只有点名页与抽奖页有）。',
  },
  {
    path: 'quick_draw.show_weight_transparency',
    reason: '闪抽页的「显示设置」分组里没有「权重透明化」行。',
  },
  {
    path: 'quick_draw.override_reminder_settings',
    reason: '闪抽页整页没有「提示语设置」分组，连覆盖开关都没有。',
  },
  {
    path: 'quick_draw.reminder_text',
    reason: '闪抽页没有「提示语设置」分组，这一类字段在客户端界面上没有入口。',
  },
  {
    path: 'quick_draw.reminder_font_size',
    reason: '同上：闪抽页没有「提示语设置」分组。',
  },
  {
    path: 'quick_draw.reminder_text_opacity',
    reason: '同上：闪抽页没有「提示语设置」分组。',
  },
  {
    path: 'lottery.display_format',
    reason: '抽奖页的「显示设置」分组里没有「显示格式」行（抽奖结果按奖盘/剩余数量显示，没有编号列）。',
  },
  {
    path: 'lottery.student_image',
    reason: '抽奖页的图片分组绑的是 lottery_image（奖盘图片），继承来的 student_image 在这一页没有行；它只被点名/闪抽页使用。',
  },
  {
    path: 'lottery.student_image_position',
    reason: '同上：抽奖页只有 lottery_image_position，没有成员头像位置那一行。',
  },
  {
    path: 'lottery.student_image_size',
    reason:
      '同上：抽奖页的图片大小绑的是 lottery_image_size（奖盘图片的大小）；继承来的 student_image_size 在这一页没有行，只被点名/闪抽页使用。',
  },
  {
    path: 'notification.default.enabled',
    reason: '「默认通知」页面上没有启用开关（只有三个渠道页共用「基础设置」里的开关）；协议却描述了它，因此控制台要么整行不画，要么按设备值只读展示。',
  },
  {
    path: 'floating_window.floating_window_theme',
    reason: '浮窗页上没有这一项：整份 FloatingWindowSettingsPage.axaml 里没有一个控件绑到 Settings.FloatingWindowTheme（同名资源键只被设置搜索的索引引用）。',
  },
  {
    path: 'floating_window.long_press_duration',
    reason: '同上：浮窗页没有「长按判定时间」这一行，Settings.LongPressDuration 没有任何界面入口。',
  },
  {
    path: 'floating_window.do_not_steal_focus',
    reason: '同上：浮窗页没有「无焦点模式」这一行，Settings.DoNotStealFocus 没有任何界面入口。',
  },
  {
    path: 'floating_window.hide_on_foreground',
    reason: '同上：浮窗页没有「前台窗口隐藏悬浮窗」这一行——Settings.HideOnForeground 只出现在配置模型与设置搜索索引里。',
  },
  {
    path: 'floating_window.hide_on_foreground_window_titles',
    reason: '同上：浮窗页没有「前台窗口标题」这一行——"前台窗口"那三项在客户端整块没有界面入口。',
  },
  {
    path: 'floating_window.hide_on_foreground_process_names',
    reason: '同上：浮窗页没有「前台进程名」这一行——"前台窗口"那三项在客户端整块没有界面入口。',
  },
  {
    path: 'voice.system_volume_control',
    reason: '客户端界面上没有这一项：没有任何设置页绑定 VoiceSettingsConfig.SystemVolumeControl。',
  },
  {
    path: 'voice.system_volume_size',
    reason: '同上：没有任何设置页绑定 VoiceSettingsConfig.SystemVolumeSize。',
  },
]


export const CLIENT_SETTINGS_PAGES_SOURCE: {
  repo: string
  clientCommit: string
  files: readonly string[]
} = {
  repo: 'SecRandom',
  clientCommit: 'e0b830a5',
  files: [
    'SecRandom/Views/SettingsPages/Personalized/AppearanceSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Personalized/AppearanceSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Personalized/FloatingWindowSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Personalized/FloatingWindowSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Personalized/TimerSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Personalized/TimerSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Linkage/LinkageSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Linkage/LinkageSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Picking/DefaultDrawSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Picking/DefaultDrawSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Picking/RollCallDrawSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Picking/DrawMusicSettingsExpander.axaml',
    'SecRandom/Views/SettingsPages/Picking/RollCallDrawSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Picking/QuickDrawSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Picking/QuickDrawSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Picking/LotteryDrawSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Picking/LotteryDrawSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Notification/DefaultNotificationSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Notification/NotificationChannelSettingsContent.axaml',
    'SecRandom/Views/SettingsPages/Notification/RollCallNotificationSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Notification/QuickDrawNotificationSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Notification/LotteryNotificationSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Notification/DefaultNotificationSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Notification/RollCallNotificationSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Notification/QuickDrawNotificationSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Notification/LotteryNotificationSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Notification/VoiceSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/Notification/VoiceSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/More/MoreSettingsPage.axaml',
    'SecRandom/Views/SettingsPages/More/MoreSettingsPage.axaml.cs',
    'SecRandom/Views/SettingsPages/Notification/NotificationChannelSettingsPageBase.cs',
    'SecRandom/Langs/SettingsPages/More/Resources.resx',
    'SecRandom/Langs/SettingsPages/More/Resources.en-US.resx',
    'SecRandom/Langs/SettingsPages/More/Resources.ja-JP.resx',
    'SecRandom/Langs/SettingsPages/Picking/Resources.resx',
    'SecRandom/Langs/SettingsPages/Voice/Resources.resx',
    'SecRandom/Langs/SettingsPages/Notification/Resources.resx',
    'SecRandom/Langs/SettingsPages/Personalized/Appearance/Resources.resx',
    'SecRandom/Langs/SettingsPages/Personalized/Appearance/Resources.en-US.resx',
    'SecRandom/Langs/SettingsPages/Personalized/Appearance/Resources.ja-JP.resx',
    'SecRandom/Langs/SettingsPages/FloatingWindow/Resources.resx',
    'SecRandom/Langs/SettingsPages/FloatingWindow/Resources.en-US.resx',
    'SecRandom/Langs/SettingsPages/FloatingWindow/Resources.ja-JP.resx',
    'SecRandom/Langs/SettingsPages/Personalized/Timer/Resources.resx',
    'SecRandom/Langs/SettingsPages/Personalized/Timer/Resources.en-US.resx',
    'SecRandom/Langs/SettingsPages/Personalized/Timer/Resources.ja-JP.resx',
    'SecRandom/Langs/SettingsPages/Linkage/Resources.resx',
    'SecRandom/Langs/SettingsPages/Linkage/Resources.en-US.resx',
    'SecRandom/Langs/SettingsPages/Linkage/Resources.ja-JP.resx',
    'SecRandom/Langs/Common/Resources.resx',
    'SecRandom/Langs/Common/Resources.en-US.resx',
    'SecRandom/Langs/Common/Resources.ja-JP.resx',
    'SecRandom/App.axaml.cs',
    'SecRandom/Services/Voice/OmniTtsSpeechProvider.cs',
    'SecRandom/Services/Voice/EdgeTtsSpeechProvider.cs',
    'SecRandom.Core/Converters/AnimationModeConverters.cs',
    'SecRandom.Core/Enums/Configs/AnimationMode.cs',
    'SecRandom.Core/Enums/Configs/DrawMode.cs',
    'SecRandom.Core/Enums/Configs/UseGlobalFontMode.cs',
    'SecRandom.Core/Enums/Configs/LotteryShowRandomMode.cs',
    'SecRandom.Core/Enums/Configs/OmniTtsProvider.cs',
    'SecRandom.Core/Enums/Configs/RollCallControlPanelPosition.cs',
    'SecRandom.Core/Enums/Configs/ThemeMode.cs',
    'SecRandom.Core/Enums/Configs/ThemeColorMode.cs',
    'SecRandom.Core/Enums/Configs/FontWeightMode.cs',
    'SecRandom.Core/Enums/Configs/TopmostMode.cs',
    'SecRandom.Core/Enums/Configs/LinkageDataSource.cs',
    'SecRandom.Core/Enums/Configs/LinkageBreakAssignment.cs',
    'SecRandom.Core/Services/Draw/RollCallAlgorithms.cs',
    'SecRandom.Core/Services/Draw/RollCallAlgorithmRegistry.cs',
    'SecRandom.Core/Models/SubConfigs/MoreSettingsConfig.cs',
    'SecRandom.Core/Models/SubConfigs/Personalized/AppearanceSettingsConfig.cs',
    'SecRandom.Core/Models/SubConfigs/FloatingWindowSettingsConfig.cs',
    'SecRandom.Core/Models/SubConfigs/TimerSettingsConfig.cs',
    'SecRandom.Core/Models/SubConfigs/LinkageSettingsConfig.cs',
    'SecRandom.Core/Services/ControlNode/ControlSettingsCatalog.cs',
    'SecRandom.Core/Services/ControlNode/ControlSettingsLabels.cs',
    'SecRandom.Core/Models/SubConfigs/Picking/DefaultDrawSettingsConfig.cs',
    'SecRandom.Core/Models/SubConfigs/Picking/DrawSettingsConfigBase.cs',
    'SecRandom.Core/Models/SubConfigs/Picking/OverridableDrawSettings.cs',
    'SecRandom.Core/Models/SubConfigs/Picking/RollCallSettingsConfig.cs',
    'SecRandom.Core/Models/SubConfigs/Picking/QuickDrawSettingsConfig.cs',
    'SecRandom.Core/Models/SubConfigs/Picking/LotterySettingsConfig.cs',
    'SecRandom.Core/Models/SubConfigs/NotificationSettingsConfig.cs',
    'SecRandom.Core/Models/SubConfigs/VoiceSettingsConfig.cs',
  ],
}
