






import type { NodeCapability } from '@/api/protocol'





const capabilities: Record<NodeCapability, string> = {
  'node.status.read': '读取状态',
  'draw.lock': '禁止 / 允许抽取',
  'draw.trigger': '触发一次抽取',
  'draw.trigger.conditions': '抽奖筛选条件',
  'draw.reset': '重置本轮',
  'roster.read': '读取名单',
  'roster.write': '修改名单',
  'settings.read': '读取设置',
  'settings.write': '修改设置',
  'proof.list': '读取证明列表',
  'media.play': '展示结果 / 播报',
}

export default {
  common: {
    appName: 'SecRandom 集控',
    appSubtitle: 'Control Plane',
    loading: '正在加载…',
    retry: '重试',
    cancel: '取消',
    confirm: '确认',
    back: '返回',
    backToHome: '返回首页',
    copyLink: '复制链接',
    revoke: '撤销',
    refresh: '刷新',
    close: '关闭',
    yes: '是',
    no: '否',
  },

  language: {
    label: '语言',
    zhCN: '简体中文',
    enUS: 'English',
    jaJP: '日本語',
  },

  account: {
    menu: '账号菜单',
    signingOut: '正在退出…',
    signOutFailed: '退出失败，请检查网络后重试',
  },

  theme: {
    toLight: '切换到浅色主题',
    toDark: '切换到深色主题',
  },

  home: {
    description:
      '用一个账号管理所有教室里的 SecRandom 客户端',
    descriptionLocal: '管理所有教室里的 SecRandom 客户端',
    signIn: '登录',
    enterConsole: '进入控制台',
    haveInvite: '我有邀请码',
    featuresLabel: '它凭什么可靠',
    featureRealtimeTitle: '设备主动上报，你在办公室就能看',
    featureRealtimeDesc:
      '教室机自己建立长连接，你在办公室就能看到每台设备在线与否、正跑哪个班',
    featureControlTitle: '一键管理设备，离线也不漏',
    featureControlDesc:
      '要停就停，恢复一样快；设备当时不在线，重连后自动生效',
    featureGroupTitle: '分组即权限边界',
    featureGroupDesc:
      '按组划边界，邀请他人加入，各自只管自己那一部分',
    featureDeviceTitle: '远程说了不算，设备说了算',
    featureDeviceDesc:
      '每台教室机保留本地开关，可以拒绝任何远程控制',
    serverVersion: '服务端版本',
    




    copyright: '© {years} 思拓创联. 保留所有权利.',
    copyrightSource: '年份取自服务端时间，不是本机时钟',
  },

  auth: {
    signInTitle: '使用思拓创联账号登录',
    signInTitleLocal: '使用本机管理员账号登录',
    signInWithSectl: '登录',
    signingIn: '正在跳转思拓创联授权…',
    signOut: '退出登录',
    alreadySignedIn: '你已登录',
    continueToConsole: '继续进入控制台',
    notConfiguredTitle: '服务端尚未完成认证配置',
    notConfiguredDesc:
      '服务端缺少思拓创联平台 ID 或回调地址，因此现在无法登录，请联系管理员补齐配置',
    errors: {
      authorization_denied: '你在思拓创联授权页取消了授权',
      invalid_state: '授权请求已失效，请重新登录',
      missing_code: '思拓创联没有返回授权码，请重新登录',
      login_failed: '登录失败：无法用授权码换取身份，请稍后重试',
      unauthorized: '会话已过期，请重新登录',
      unknown: '登录时发生未知错误，请稍后重试',
      service_unavailable:
        '服务暂时不可用，请稍后重试，或联系管理员检查服务是否已启动',
      network_error: '无法连接到服务端，请检查网络后重试',
      not_configured:
        '服务端尚未完成认证配置，暂时无法登录，请联系管理员',
    },
    securityNote: '浏览器只保存一个不透明的会话标识，思拓创联的访问令牌保存在服务端',
    password: {
      title: '使用本地账号登录',
      usernameLabel: '用户名',
      usernamePlaceholder: '管理员用户名',
      passwordLabel: '密码',
      passwordPlaceholder: '管理员密码',
      submit: '登录',
      submitting: '正在登录…',
      securityNote: '本地账号的密码只由本机服务端校验，浏览器里只留一个不透明的会话标识',
      errors: {
        unauthorized: '用户名或密码不正确',
        invalid_credentials: '用户名或密码不正确',
        too_many_attempts: '登录尝试过于频繁，请稍后再试',
        auth_not_configured: '该实例尚未配置身份源，暂时无法登录',
      },
    },
  },

  setup: {
    title: '初始化这个实例',
    subtitle: '几步就能把服务端跑起来，完成后用本地账号登录',
    checking: '正在检查初始化状态…',
    unavailableTitle: '暂时无法确认初始化状态',
    alreadyInitializedTitle: '这个实例已经初始化过了',
    alreadyInitializedDesc: '重复初始化会覆盖现有的成员与数据，因此这里不再提供向导，请直接登录',
    goToLogin: '去登录',
    step: {
      mode: '选择运行模式',
      displayName: '命名这个实例',
      identity: '填写实例信息',
      token: '填写安装令牌',
    },
    modeLabel: '运行模式',
    chooseMode: '请选择一种运行模式',
    noModes: '当前服务端没有可用的运行模式，请检查服务端配置或版本',
    displayNameLabel: '实例名称',
    displayNamePlaceholder: '例如：实验一中集控',
    displayNameHint: '显示在控制台标题与客户端连接信息里，之后可以再改',
    credentialsLabel: '管理员账号',
    adminUsernameLabel: '管理员用户名',
    adminUsernamePlaceholder: '3-32 位字母、数字或 . _ -',
    adminUsernameRule: '用户名需为 3-32 位，只能用字母、数字、点、下划线与连字符',
    adminPasswordLabel: '管理员密码',
    adminPasswordRule: '密码至少 8 位，最长 128 位',
    confirmPasswordLabel: '确认密码',
    passwordMismatch: '两次输入的密码不一致',
    tokenLabel: '安装令牌',
    tokenPlaceholder: '粘贴服务端启动日志里的安装令牌',
    tokenHint: '服务端每次以未初始化状态启动都会在日志里打印一串安装令牌（setup token），用它确认你有权初始化本机实例',
    next: '下一步',
    previous: '上一步',
    submit: '完成初始化',
    submitting: '正在初始化…',
    doneTitle: '初始化完成，可以登录了',
    doneDesc: '本机实例已经就绪，用刚才设置的管理员账号登录即可',
    errors: {
      setup_token_invalid:
        '安装令牌不正确，服务端每次以未初始化状态启动都会重新生成，请核对日志里最新打印的那一串',
      already_initialized: '这个实例已经初始化过了，本页向导不再生效',
      setup_rate_limited: '尝试次数过多，请稍后再试',
      too_many_attempts: '尝试次数过多，请稍后再试',
      mode_not_available: '这个运行模式当前不可用，请另选一种',
      admin_username_invalid: '管理员用户名不合法：需为 3-32 位，只能用字母、数字、点、下划线与连字符',
      admin_password_too_short: '管理员密码太短：至少 8 位',
      auth_not_configured: '服务端没有装身份源，无法完成初始化',
      invalid_request: '请求参数不合法：请检查实例名称、用户名与密码',
    },
  },

  join: {
    title: '加入组',
    subtitle: '粘贴对方发来的邀请链接，或直接填写邀请码，整个链接粘进来就行，系统会自动取出里面的邀请码',
    codeLabel: '邀请码 / 邀请链接',
    codePlaceholder: '输入邀请码，或粘贴整条邀请链接',
    pasteLinkLabel: '粘贴邀请链接',
    pasteLinkPlaceholder: '也可以把对方发来的完整邀请链接整个粘进上面的输入框，系统会自动取出其中的邀请码',
    submit: '加入组',
    submitting: '正在加入…',
    signInFirst: '使用思拓创联账号登录并加入',
    signInFirstLocal: '登录后加入这个组',
    signInHint: '登录后会自动回到本页完成加入，邀请码随登录状态保留，不会丢失',
    warning: '邀请码一次有效，创建后 72 小时过期，请不要转发到公开群',
    alreadyMemberAction: '去看我的组',
    noGroupYet: '我还没有组，先创建一个',
    errors: {
      expired: '邀请码已过期，邀请码创建后 72 小时内有效，请联系邀请你的人重新生成一个',
      used: '这个邀请码已经被用过了，如果你已经在组里，就无需再次加入；否则请联系邀请人重新生成一个',
      revoked: '邀请码已被撤销，请联系邀请人重新生成',
      not_found: '找不到这个邀请码，请检查是否输入正确',
      forbidden: '这个邀请码不是发给你的',
      not_member_of_group: '你已经是该组成员',
      link_without_code:
        '这个链接里没有邀请码，请把对方发来的完整邀请链接（含 code=…）粘进来，或直接填写邀请码',
      already_member: '你已经是这个组的成员，不能重复加入，如果你手上的是新邀请码，可能是它已经被用掉了',
      unknown: '加入失败，请稍后重试',
    },
  },

  console: {
    fontCredits: '字体：MiSans（小米）· 图标：FluentSystemIcons（Microsoft，MIT）',
    backToConsoleHome: '返回控制台首页',
    myGroups: '我的组',
    myGroupsEmpty: '你还不属于任何组，用「创建组」新建一个，或用「输入邀请码」加入别人的组',
    emptyTitle: '你还没有加入任何组',
    joinCardTitle: '加入别人的组',
    createGroup: '创建组',
    createCardDesc: '新建一个组并成为创建者，然后邀请他人加入',
    joinWithCode: '输入邀请码加入',
    currentGroup: '当前组',
    nodes: '节点',
    members: '成员',
    auditLog: '审计日志',
    signedInViaSectl: '通过思拓创联登录',
    signedInViaLocal: '通过本地账号登录',
    notSignedIn: '未登录',
    checkingSession: '正在确认登录状态…',
    signInRequired: '登录',
    signInRequiredDesc: '未登录或会话已失效，点击下方按钮跳转到思拓创联完成授权，登录后会回到本页',
    groupNotFound: '找不到这个组',
    groupNotFoundDesc: '它可能已被删除，或者你不是它的成员，组是权限边界——不属于该组时看不到任何内容',
    role: '角色',
    groupQuotaHint: '你拥有的组 / 建组上限，到上限后需要先把不再需要的组转让给他人',
    joinedGroups: '加入的组',
    noOwnedGroups: '还没有自己创建的组',
    noJoinedGroups: '还没有加入别人的组',
    sortLongPress: '长按可排序',
    sortHint: '拖动，或用 ↑↓ 排序',
    sortDone: '完成',
    sortCancel: '取消',
    moveUp: '上移',
    moveDown: '下移',
  },

  group: {
    nodeCount: '节点总数',
    online: '在线',
    offline: '离线',
    lastHeartbeat: '最后心跳',
    localRemoteDisabled: '本机已禁用远控',
    drawLocked: '禁止抽取中',
    details: '详情',
    detailPage: '详情页',
    displayName: '设备名',
    displayNameUnset: '未命名（可在该设备的客户端上设置）',
    nodeIdLabel: '节点 ID',
    registeredAt: '首次登记',
    lockDraw: '禁止抽取',
    unlockDraw: '允许抽取',
    drawLockHint: '期望状态，不是一次性命令：设备当前离线也照样生效，它上线后自动收敛',
    drawLockUnsupported: '这台设备没有声明「禁止 / 允许抽取」能力，无法被远程锁定',
    triggerDraw: '立即抽取',
    triggerConfirm: '确认抽取',
    triggerHint: '动作型命令，带过期时间，过期即丢弃、绝不补执行',
    triggerUnsupported: '这台设备没有声明「触发一次抽取」能力',
    removeNode: '移除节点',
    removeNodeHint: '只清掉这条登记记录，不阻止这台机器再次接入',
    removeNodeConfirm:
      '确认移除这台机器的登记记录？这不能阻止它再次接入——那位成员还在组里的话，机器重新连上来就会重新出现',
    selectAll: '全选',
    selected: '已选',
    batchLock: '批量禁止抽取',
    batchUnlock: '批量允许抽取',
    clearSelection: '取消选择',
    skippedNodes: '有 {count} 台没有声明「禁止 / 允许抽取」能力，已跳过',
    batchAnnounce: '批量播报',
    batchAnnouncePlaceholder: '要播报的内容',
    batchAnnounceSend: '播报',
    batchAnnounceHint: '不超过 200 字，用每台设备本机的语音引擎播报；正在抽取的机器会拒绝',
    batchRemove: '批量移除',
    batchRemoveConfirm:
      '确认移除选中的 {count} 台机器的登记记录？这不能阻止它们再次接入——那几位成员还在组里的话，机器重新连上来就会重新出现',
    batchFailedIds: '失败设备：{ids}',
    skippedMediaNodes: '有 {count} 台没有声明「播报」能力，已跳过',
    rowOk: '已下发',
    rowFailed: '失败：{reason}',
    viewNodeDetail: '打开这台设备的详情页',
    filterOnline: '只看在线',
    filterLocked: '只看禁止抽取中',
    clearFilter: '清除筛选',
    noMatchingNodes: '没有符合当前筛选条件的节点',
    batchOk: '已完成：{count} 台',
    batchPartial: '部分完成：成功 {ok} 台，失败 {failed} 台',
    batchFailed: '失败：{count} 台',
    nodeControlNote:
      '本机远控开关与能力清单都由设备自己上报，服务端无法改成别的值；「禁止抽取中」则是控制台下发的期望状态，两者是两回事',
    memberCount: '成员',
    noNodes: '还没有节点加入这个组',
    noNodesHint:
      '在教室机上安装 SecRandom 客户端并登录同一思拓创联账号，选择加入本组后即可出现在这里',
    noNodesHintLocal: '在教室机上安装 SecRandom 客户端，选择加入本组后即可出现在这里',
    capabilities: '能力清单',
    capabilitiesHint: '操作按钮按节点声明的能力裁剪：不支持的能力不会出现，避免"点了没反应"',
    deviceSwitchNote:
      '节点本机的"是否允许被集控"开关由设备自己掌握，服务端无法绕过，关掉后该节点会显示"本机已禁用远控"',
    units: '台',
    ownerLabel: '创建者',
    groupIdLabel: '组 ID',
    youAre: '你是',
    batchConfig: '统一配置',
    batchConfigHint:
      '只下发设置项（不含抽取、播报、锁机等动作）：在独立页面里勾选要统一的项、填好值，再一次性下发',
    batchConfigNoTargets: '勾选的 {count} 台都没有声明「远程改设置」能力，下发会被设备拒绝',
    enrollment: {
      title: '设备接入',
      hint: '接入码 15 分钟内有效，只能用于一台设备；设备用码接入后会自动拿到一枚长期令牌，之后不再需要输入接入码',
      create: '生成接入码',
      refresh: '刷新',
      newCodeTitle: '新接入码（只显示这一次）',
      newCodeHint: '把这串码填进教室机上的 SecRandom 客户端；离开本页后服务端不再回显明文',
      remaining: '剩余',
      expired: '已过期',
      copyCode: '复制接入码',
      copied: '已复制',
      revoke: '撤销',
      revokeCodeConfirmTitle: '撤销这个接入码？',
      revokeCodeConfirmBody: '撤销后谁也再用不了这个码；已经接入的设备不受影响',
      codesTitle: '接入码',
      codesEmpty: '还没有生成过接入码',
      codePending: '待使用',
      codeUsed: '已使用',
      codeExpired: '已过期',
      codeRevoked: '已撤销',
      codeExpiresAt: '有效期至',
      devicesTitle: '设备',
      devicesEmpty: '这个组还没有登记过设备',
      accessEnrolled: '已接入',
      accessNone: '未接入',
      accessExpired: '令牌已失效',
      accessRevoked: '令牌已撤销',
      accessEnrolledCount: '已接入 {count}',
      accessNoneCount: '未接入 {count}',
      stateOnline: '在线',
      stateOffline: '离线',
      permissionAllowed: '允许远程控制',
      permissionDenied: '禁止远程控制',
      tokenExpiresAt: '令牌有效期至',
      issueToken: '签发令牌',
      reissueToken: '重发令牌',
      revokeToken: '撤销令牌',
      revokeTokenConfirmTitle: '撤销这台设备的令牌？',
      revokeTokenConfirmBody: '撤销后这台设备立刻掉线，必须重新用接入码接入才能回到集控',
      tokenTitle: '新令牌（只显示这一次）',
      tokenHint: '立刻复制并填进设备；离开本页后无法再次查看',
      copyToken: '复制令牌',
      close: '知道了',
    },
  },

  batchConfig: {
    title: '统一下发配置',
    subtitle:
      '勾选要统一的设置项、填好值，再一次性下发到本次选中的节点。本页只下发设置，不会触发抽取、播报或锁机；没有勾选的项在这些机器上保持原样。',
    backToGroup: '返回组',
    targetsTitle: '本次下发目标',
    skippedUnsupported: '有 {count} 台没有声明「远程改设置」能力，已跳过（下发会被设备拒绝）',
    skippedUnknown: '有 {count} 台不在本组的节点列表里，已跳过（可能已被移除或换了组）',
    offlineHint:
      '其中 {count} 台当前离线：这条命令带过期时间（默认 120 秒），投不到就会被丢弃，设备上线后不会补执行',
    emptySelection: '没有选中任何节点',
    emptySelectionHint: '回组页的节点列表勾选要统一下发的机器，再点「统一配置」',
    adminRequired: '需要「管理员」及以上才能下发设置',
    nodesFailed: '读不到节点列表：{reason}',
    noTargets: '勾选的机器都没有声明「远程改设置」能力，下发会被设备拒绝',
    include: '下发',
    keep: '不改变',
    on: '开启',
    off: '关闭',
    emptyValue: '空值（清空）',
    note:
      '只下发设置：不会触发抽取、播报、锁机；安全设置、集控设置、桌面集成与更新设置不在可远程修改的白名单里',
    readonlyNote:
      '有 {count} 项在客户端就不可远程修改（字体、本机音乐库、插件算法…），已列在页面上但不参与下发',
    pending: '待下发 {count} 项',
    none: '还没有选择要下发的设置项',
    ready: '将要下发 {count} 项设置',
    summaryTitle: '本次下发内容',
    summaryEmpty: '还没有选择要下发的设置项',
    submit: '下发到 {count} 台',
    submitting: '正在下发…',
    clear: '清空选择',
    confirm: '将向 {count} 台机器下发 {items} 项设置，确定？',
    problemMissing: '「{path}」还没有填值',
    problemNotNumber: '「{path}」需要一个数字',
    problemNotOption: '「{path}」只能是：{options}',
    resultTitle: '下发结果',
    resultItems: '本次下发 {items} 项设置',
  },

  nodeDetail: {
    backToGroup: '返回节点列表',
    notFound: '这台设备不在本组的节点列表里',
    notFoundHint:
      '可能已被移除，或者它换了组；节点是「成员资格 + 连接即登记」的结果：那位成员重新连上来时会再次出现',
    overview: '设备信息',
    actions: '节点操作',
    platformLabel: '平台',
    versionLabel: '版本',
    tabs: {
      overview: '总览',
      settings: '设置',
      roster: '名单',
      commands: '命令记录',
    },
    rosterKind: {
      students: '点名名单',
      prizes: '抽奖名单',
    },
    summary: {
      title: '状态小结',
      connection: '连接',
      desiredLock: '抽取开关（控制台下发）',
      localRemote: '本机远控',
      localRemoteAllowed: '本机开关开着，允许被集控',
      lastCommand: '最近一条命令',
    },
    adminRequired: '需要「管理员」及以上才能远程改设置与下发名单',
    commandStatus: '命令回执',
    awaitingResult: '正在等待设备回执…',
    resultDetailLabel: '设备返回',
    reasonNotWritable:
      '设备拒绝了这条命令：设置项 {path} 不允许远程修改；安全设置、集控设置、桌面集成（开机自启、协议注册）与更新设置都不在远程白名单里',
    reasonBusy: '设备正在抽取，这条命令被拒绝，等这一次抽完再下发',
    reasonUnsupportedAction: '设备不支持这个动作：屏幕显示尚未实现，只能语音播报',
    desiredState: '抽取开关（期望状态）',
    revisionLabel: '版本号 revision',
    delivered: '已投递到设备',
    notDelivered: '设备离线，未投递：设置已落库，它上线后自动收敛',
    mediaUnsupported: '这台设备没有声明「播报」能力',
    settingsUnsupported: '这台设备没有声明「远程修改设置」能力',
    mediaTitle: '播报一句话',
    mediaPlaceholder: '例如：请第一组上台',
    mediaHint:
      '只走设备本机的语音引擎（音色、音量、语速都由那台机器决定），正文不会写进日志；屏幕显示尚未在客户端实现',
    mediaSend: '播报',
    mediaEmpty: '请先输入要播报的内容',
    mediaTooLong: '播报内容不能超过 200 字',
    settingsTitle: '远程改设置',
    settingsNote:
      '设置项的名称与说明由设备本机给出，只有设备标为可远程修改的项才能下发；安全设置、集控设置、桌面集成与更新设置不能远程修改',
    settingsRange: '{min} ~ {max}',
    rosterModeReplace: '整份覆盖（缺的人会被删除）',
    settingsRead: {
      title: '设备当前的设置',
      read: '从设备读取',
      reading: '正在读取…',
      hint:
        '页面结构、名称与说明取自客户端自己的设置页；当前值、取值范围与「能否远程修改」以设备上报的为准，只有设备标为可远程修改的项才能下发',
      deviceLanguage: '分类与说明取自客户端自己的设置页（随控制台语言显示）；当前值与能否远程修改由设备上报',
      unsupported: '读不到设置：这台设备或服务端还不支持「读取设置」（缺少 settings.read 或读通道）',
      operatorRequired: '需要「操作者」及以上才能读取设备设置',
      failed: '读取失败：{reason}',
      empty: '设备没有返回任何设置分组',
      notWritable: '不可远程修改',
      changes: '待下发 {count} 项',
      noChanges: '还没有改动',
      submit: '下发变更',
      range: '{path} 需要在 {min} ~ {max} 之间',
      notNumber: '{path} 需要一个数字',
      notOption: '{path} 只能是：{options}',
      refreshed: '已重新读取设备，界面与设备当前值对齐',
      batched: '这台设备的设置一次读不完（回执超过单帧上限），已按分类分批读取',
      tooLarge: '这台设备的设置太多：连单个分类的回执都超过单帧上限，读不回来',
      valueUnknown: '未读取',
      readFirst: '先「从设备读取」，读取之后才能修改',
    },
    settingsCategory: {
      roll_call: '点名',
      quick_draw: '快捷抽取',
      lottery: '抽奖',
      notification: '通知',
      voice: '语音',
    },
    rosterRead: {
      title: '设备上的名单',
      read: '读取设备名单',
      reading: '正在读取…',
      unsupported: '读不到名单：这台设备或服务端还不支持「读取名单」（缺少 roster.read 或读通道）',
      adminRequired: '需要「管理员」及以上才能读取设备名单',
      failed: '读取失败：{reason}',
      empty: '设备上还没有名单',
      current: '当前使用',
      truncated: '已截断',
      truncatedHint:
        '设备只回传了前 {count} 条（共 {total} 条），用「整份覆盖」会删掉没回传的人，建议改用「只增改」',
      members: '{count} 人',
      membersPrizes: '{count} 个奖项',
      pickList: '先选中一份名单',
      editHint: '改动只在你这一侧：点「下发草稿」才会写到设备上',
      importNeedsList: '先选中一份名单，再导入文件',
      submit: '下发草稿',
      addRow: '添加一行',
      removeRow: '删除这一行',
      noRows: '这份名单里没有成员',
      colId: 'ID',
      colStudentName: '姓名',
      colPrizeName: '奖项名',
      colGender: '性别',
      colGroup: '分组',
      colEnabled: '启用',
      colCount: '数量',
      colWeight: '权重',
    },
    






    client: {
      groups: {
        









        general: '通用设置',
        personalized: '个性化设置',
        listManagement: '名单管理',
        picking: '抽取设置',
        notification: '通知设置',
        history: '历史记录',
        





        more: '更多设置',
        other: '其他',
      },
      navLabel: '设置分组',
      categoryEmpty: '这一组没有可读取的设置项',
      roster: {
        changeList: '切换名单',
        drawerTitle: '选择名单',
        drawerHint: '点一份名单，右边的表格就是它的成员',
        colTags: '标签',
        colActions: '操作',
        tagsPlaceholder: '用逗号分隔',
        importAction: '从文件导入',
        exportAction: '导出 CSV',
        exportEmpty: '当前草稿没有内容',
        exported: '已导出 {count} 行',
      },
      import: {
        title: '从文件导入名单',
        pickFile: '选择 .xlsx / .xls / .csv 文件',
        reading: '正在读取文件…',
        unreadable: '这个文件读不出内容：可能已损坏，或不是表格文件',
        sheet: '工作表',
        headerRow: '表头行',
        headerAuto: '自动识别（第 {row} 行）',
        headerNone: '没有表头（按固定列序）',
        firstRow: '起始行',
        lastRow: '结束行',
        mapping: '列对应',
        preview: '预览（前 {count} 行）',
        unmapped: '未对应',
        confirm: '用这份文件替换草稿',
        hint: '导入只改控制台里的草稿，还要点「下发草稿」才会写到设备上',
        skipped: '跳过 {count} 行空行',
        problemNoColumns: '没有认出任何一列，请手动指定列对应',
        problemEmptyRegion: '这个区域里没有可导入的行（编号与姓名都为空的行会被跳过）',
        problemDuplicateId: '第 {row} 行编号重复：{id}',
        problemBadNumber: '第 {row} 行的{column}不是数字',
        problemTooManyRows: '文件里有 {count} 行，超过设备一次能接受的 {max} 行',
        columns: {
          id: '编号',
          name: '姓名',
          gender: '性别',
          group: '分组',
          tags: '标签',
          enabled: '启用',
          count: '数量',
          weight: '权重',
        },
      },
      







      hotkey: {
        capture: '按下快捷键',
        recording: '按下组合键…（Esc 取消）',
        clear: '清空快捷键',
      },
      






      broadcast: {
        title: '播报选项',
        hint: '这些选项只作用于这一次播报，不会写回设备的设置',
        quickDrawWindow: '显示闪抽窗口',
        systemVolume: '系统音量',
        voiceVolume: '播报音量',
        volumeKeep: '不修改',
        volumeSet: '设定为',
        volumeRange: '0–100，播报结束后恢复原值',
        volumeInvalid: '音量要填 {min}–{max} 之间的整数',
      },
    },
    commands: {
      title: '本页会话的命令记录',
      sessionNote:
        '只记录这次打开页面后由你下发的命令，刷新页面即清空，更多操作留痕在组的「审计」里',
      empty: '这一页还没有下发过命令',
      idLabel: '命令 ID',
      capabilityLabel: '能力',
      kindLabel: '类型',
      statusLabel: '状态',
      detailLabel: '设备返回',
      





      revoke: '撤销',
      revokeConfirm: '再点一次确认撤销',
      revoking: '正在撤销…',
      revokeDone: '已撤销：设备上线后不会执行这条命令',
      revokeFailed: '撤销失败：{reason}',
      





      revokeQueuedHint: '设备离线，这条命令还在队列里排队，现在撤销，它上线时就不会执行',
    },
    feedback: {
      mediaDisabled: '这台机器关闭了语音总开关，远程播报不会出声',
      voiceEnableFix: '打开语音',
      voiceEnableNeedsSettings: '一键打开语音需要「远程修改设置」能力（管理员及以上）',
      textTooLong: '设备拒绝了这条播报：本机限制最多 {max} 字',
      textTooLongUnknown: '设备拒绝了这条播报：超过了本机的长度限制',
      capabilityUnsupported: '设备拒绝执行 {capability}：本机没有声明这个能力',
      capabilityUnsupportedUnknown: '设备拒绝了这条命令：本机没有声明这个能力',
      supportedLabel: '设备声明支持：',
      localRemoteDisabled: '这台机器本机开关关着（设备自己关的，控制台改不了）',
      rateLimited: '设备限流了：{window} 秒内最多接受 {max} 条命令，请稍后重试',
      rateLimitedUnknown: '设备限流了，这条命令被拒绝，请稍后重试',
      notWritable:
        '设备拒绝了这条命令：这个设置项不允许远程修改，安全设置、集控设置、桌面集成与更新设置都不在远程白名单里',
      writablePaths: '允许远程修改的路径：{paths}',
      invalidValue: '设备拒绝了 {path}：值不合法，没有应用',
      invalidValueNoPath: '设备拒绝了这条命令：值不合法，没有应用',
      invalidValueDetail: '设备给出的细节：{detail}',
      unsupportedActionName: '被拒的动作：{action}',
      expired: '这条命令在设备收到之前就过期了，动作命令过期即丢弃，绝不补执行，请重新下发',
      invalidCommand: '设备认为这条命令本身不合法（协议字段缺失或类型不对）',
      
      invalidCommandField: '设备认为这条命令里的「{field}」不合法（协议字段缺失或类型不对）',
      
      unsupportedField: '这台设备没有实现「{field}」这个选项，这次不下发它就不会失败',
      unknown: '设备返回了一个控制台还不认识的原因码：{code}',
      contextOnly: '设备返回了结构化结果，但没有给出原因码',
      rawContextLabel: '原始 result_context',
      




      drawDenied: '设备拒绝了这次抽取：{reason}',
      
      drawDeniedNoCandidate: '这台机器的可抽取名单里没有人（名单为空，或成员都被停用了）',
      
      drawDeniedClassTime: '本机判定现在是上课时间（联动设置），这次不抽',
      
      drawDeniedNeedsLocal:
        '这台机器要求当场本机验证（密码 / TOTP / USB），远程命令不会拉起验证框',
      
      drawLocked: '这台机器的抽取被控制台锁定了，先在概览里解除',
      
      drawBusy: '这台机器正在抽取中，请等这一轮结束再试',
      
      drawDrawing: '设备正在抽取，不能中途改设置',
      






      drawListNotFound: '设备上没有名为 {list} 的名单',
      
      drawListNotFoundNoName: '设备上找不到这份点名名单',
      
      drawNoMatching: '这个条件下没有可抽取的人：{field} = {value}',
      
      drawCountOutOfRange: '人数超出可抽范围：这份名单里符合条件的有 {min}–{max} 人，换一个数再试',
      
      drawnMembers: '抽到了：{names}',
    },
    






    draw: {
      title: '抽取设置',
      
      hint: '只作用于这一次下发，不改设备上的默认设置',
      
      scopeQuick: '快抽（设备默认名单）',
      
      scopeRollCall: '点名单',
      
      scopeLottery: '抽奖池',
      
      scopeLotteryHint: '在指定奖池里抽 N 个奖项，不带顶层性别 / 分组',
      
      conditions: {
        title: '筛选条件',
        hint: '按奖品标签或发放对象筛选，只作用于这一次下发',
        
        unsupported: '该设备不支持条件抽取，只能按整个奖池抽',
        tagsLabel: '奖品标签',
        tagsHint: '命中任一标签即可（可多选）',
        tagsEmpty: '这个奖池没有标签，或还没读取奖池',
        studentListLabel: '发放对象',
        studentListNone: '不指定',
        studentListNeedsRead: '指定发放对象要先读取设备上的学生名单',
        readStudents: '读取学生名单',
        recipientNote: '发放对象只在设备侧生效：回执里只会显示奖品名，看不到发给了谁',
        failedVersion: '设备不支持这个版本的条件格式，请升级设备端',
        failedUnsupportedField: '设备不认识条件里的某个字段，请升级控制台',
        failedStudentListRequired: '填了性别 / 分组，就必须先选发放对象名单',
        failedStudentListNotFound: '设备上找不到这个学生名单，它可能已经被改名或删除',
        failedTagsNotInList: '选的标签不在这个奖池里，请重新读取奖池后再选',
        failedValueNotInList: '这个性别 / 分组不在该学生名单里，请重新读取名单后再选',
        failedNoMatching: '按这些条件筛完没有可抽的对象，请放宽条件',
      },
      
      listNeedsReadPrizes: '抽奖要先读取设备上的奖池（在「名单」页签里读，或点上面的读取按钮）',
      
      failedLocked: '这台机器正被禁止抽取，先在上面的「允许抽取」里解锁再来',
      
      failedListNotFound: '设备上找不到这本名单或奖池，它可能已经被改名或删除',
      
      failedLotteryCondition: '抽奖不接受性别 / 分组条件，请去掉这两项再下发',
      
      scopeQuickHint: '不传任何参数，与旧控制台逐字一致：设备按自己的快抽默认名单抽 1 个',
      listLabel: '名单',
      
      listNone: '不指定（用设备当前的默认名单）',
      
      listNeedsRead:
        '要按名单点名，先在「名单」页签点「读取设备名单」（需要管理员及以上）',
      genderLabel: '性别',
      groupLabel: '分组',
      
      conditionAny: '不限',
      countLabel: '人数',
      
      countHint: '1–{max}；超过名单里符合条件的人数会被设备拒绝并告诉你上限',
      targetLabel: '抽取方式',
      submit: '下发这次抽取',
      drawnTitle: '最近一次抽取',
      
      drawnEmpty: '设备没有在回执里带抽取结果',
      drawnList: '名单：{list}',
      drawnCount: '人数：{count}',
      
      localCheck: '本机预检',
      localCheckOk: '条件在名单里成立，预计可抽 {count} 人',
      localCheckNoCandidate: '这份名单里没有可抽取的人（都被停用了）',
      localCheckGender: '这个名单里没有性别「{value}」',
      localCheckGroup: '这个名单里没有分组「{value}」',
      
      localCheckCount: '人数超出这份名单的可抽范围：符合条件的有 {min}–{max} 人',
      
      localCheckIncomplete: '设备只回传了名单的前 {count} 条（共 {total} 条），预检可能不准',
      localCheckTruncated: '这份名单在设备侧被截断，预检可能不准',
      
      advanced: '展开设置',
      
      collapse: '收起',
      
      legendCount: '{count} 人',
      
      readRoster: '读取设备名单',
      
      reading: '正在读取…',
    },
    drawReset: {
      title: '重置本轮',
      button: '重置本轮',
      confirm: '确认重置',
      hint: '只清空这台机器本轮的抽取进度（谁已经被抽过），不会删除历史记录',
      historyNote: '历史记录不受影响',
      targetLabel: '对象',
      targetRollCall: '点名',
      targetLottery: '抽奖',
      targetQuick: '快速抽取',
      listLabel: '名单',
      listNone: '当前默认名单',
      listNeedsRead: '在「名单」页签读取设备名单后，才能指定要重置哪一本',
      unsupported: '这台设备没有声明「重置本轮」能力',
      success: '已重置 {count} 条本轮记录',
      failedTarget: '设备不认识这个重置对象：{reason}',
      failedList: '设备上找不到这本名单',
      failed: '重置失败：{reason}',
    },
    statuses: {
      queued: '排队中（设备离线，等它上线补投）',
      delivered: '已投递给设备，尚未收到执行结果',
      accepted: '设备已接受，正在执行',
      completed: '执行完成',
      rejected: '设备拒绝了（配置问题，不是运行故障）',
      failed: '设备接受了但执行失败',
      
      revoked: '已撤销（设备上线后也不会执行）',
    },
  },

  roles: {
    viewer: '查看者',
    operator: '操作者',
    admin: '管理员',
    owner: '创建者',
  },

  rolesDesc: {
    viewer: '只看状态与汇总',
    operator: '远控：允许/禁止抽取、触发抽取、展示等等',
    admin: '操作者 + 改设置、改数据 + 管成员、管节点注册',
    owner: '全部权限，含组删除与转让',
  },

  capabilities,

  groupForm: {
    createTitle: '创建组',
    createCardDesc: '一个组 ≈ 一个管理单元（年级 / 校区 / 机房），组是权限边界：不同教室的人不一样，想隔离就多建组',
    nameLabel: '组名称',
    namePlaceholder: '例如：教学楼 3栋 2楼',
    nameHint: '建议写成「班级 · 位置」，方便在多组之间快速辨认',
    creating: '正在创建…',
    create: '创建',
    renameTitle: '重命名组',
    rename: '保存',
    renameAction: '重命名',
    renaming: '正在保存…',
    




    deleteTitle: '解散这个组',
    deleteAction: '解散组',
    deleteWarning:
      '解散后，组内所有成员立刻失去访问权限，邀请码、节点登记、命令记录与抽取设置一并删除，且无法恢复',
    deleteConfirmLabel: '请输入组名「{name}」以确认',
    deletePlaceholder: '组名称',
    deleteMismatch: '组名不一致，请照上面的名字原样输入',
    deleteSubmit: '确认解散',
    deleting: '正在解散…',
  },
  members: {
    title: '成员',
    empty: '这个组还没有其他成员，用「邀请」生成邀请码或链接发给他人',
    you: '你',
    joinedAt: '加入时间',
    changeRole: '改角色',
    remove: '移除',
    removeConfirmTitle: '移除成员',
    removeConfirmBody: '移除后该账号立刻失去本组的全部权限，他仍可自己建组，或用新的邀请码重新加入',
    roleUpdated: '角色已更新',
    removed: '已移除该成员',
    ownerBadgeHint: '创建者只能通过「转让」变更，不能被移除，也不能由他人直接授予',
    selectRole: '选择角色',
    onlyOwnerCanTransfer: '只有创建者可以发起转让',
  },
  invites: {
    title: '邀请',
    empty: '还没有邀请，生成一个邀请码或链接发给他人，对方登录后兑换即入组',
    create: '新建邀请',
    createTitle: '新建邀请',
    roleLabel: '赋予的角色',
    roleHint: '只能邀请低于自己等级的角色',
    copyLink: '复制链接',
    copied: '链接已复制',
    revoke: '撤销',
    revokeConfirmTitle: '撤销邀请',
    revokeConfirmBody: '撤销后这个邀请码立刻失效，已兑换的不受影响',
    codeLabel: '邀请码',
    linkLabel: '邀请链接',
    status: '状态',
    createdBy: '创建者',
    expiresAt: '过期时间',
    usedBy: '兑换人',
    statusPending: '待兑换',
    statusUsed: '已兑换',
    statusExpired: '已过期',
    statusRevoked: '已撤销',
  },
  transfer: {
    title: '转让创建者',
    description: '选择一位成员作为新的创建者，转让后你会降为管理员',
    selectMember: '选择成员',
    request: '发送转让请求',
    requesting: '正在发送…',
    pendingTitle: '等待对方确认',
    pendingBody: '转让请求已发出，但权限尚未发生任何变化，需要对方在自己的登录会话里确认后才生效',
    waitingForRecipient: '等待 {name} 确认',
    incomingTitle: '有人要把创建者转让给你',
    incomingBody: '成为创建者后，你将拥有移除任何成员、转让创建者等全部权力，确认前请确认这是你本人的意愿',
    accept: '接受并成为创建者',
    accepting: '正在确认…',
    reject: '拒绝',
    expiresAt: '有效期至 {time}（超时自动作废）',
    endedTitle: '上一次的转让请求已经结束',
    endedBody: '对方拒绝了，或超过了确认时限，权限没有任何变化，需要的话可以重新发起',
    restart: '重新发起',
    confirmedTitle: '你已成为创建者',
    confirmedBody: '原创建者已降为管理员，现在只有你能移除成员或再次转让创建者',
    rejectedNotice: '已拒绝本次转让，权限没有任何变化',
    twoPartyHint: '转让需要双方确认',
  },
  audit: {
    title: '审计日志',
    empty: '还没有审计记录',
    time: '时间',
    action: '事件',
    actor: '操作人',
    device: '来源设备',
    outcome: '结果',
    target: '对象',
    detail: '明细',
    targetMember: '成员',
    targetNode: '设备',
    targetInvite: '邀请',
    targetTransfer: '转让',
    targetGroup: '本组',
    outcomeSuccess: '成功',
    outcomeDenied: '被拒绝',
    outcomeFailed: '失败',
    restrictedHint: '审计含成员与设备信息，因此仅管理员及以上可见',
    total: '共 {count} 条',
    pageOf: '第 {page} / {pages} 页',
    prevPage: '上一页',
    nextPage: '下一页',
    filterAll: '全部',
    filterGroup: '组',
    filterType: '事件类型',
    filterOutcome: '结果',
    filterRange: '时间范围',
    filterActorDevice: '来源设备',
    filterTargetNode: '被操作设备',
    filterActor: '操作者',
    sourceWeb: '浏览器会话',
    sourceApp: 'App 端',
    facetsTruncated: '设备与操作者候选过多，只列出最常用的前 500 项；可以用其它筛选缩小范围',
    rangeAll: '全部时间',
    rangeToday: '今天',
    range7d: '近 7 天',
    range30d: '近 30 天',
    emptyFiltered: '没有符合条件的记录',
    export: '导出 CSV',
    exporting: '正在导出…',
    exported: '已导出 {count} 条记录',
    exportTruncated: '记录过多，只导出了最新的 {count} 条；请用筛选缩小范围后再导一次',
    exportEmpty: '当前筛选没有记录，没有可导出的内容',
    exportFailed: '导出中断，没有生成文件；请重试',
  },
  





  auditDetail: {
    roleChanged: '角色 {from} → {to}',
    removedRole: '被移除时的角色：{role}',
    joinedRole: '以 {role} 身份加入',
    inviteRole: '邀请角色：{role}',
    expectedUserMismatch: '邀请码限定给指定账号，兑换的人不是它指定的那位',
    capabilityAction: '下发 {capability}',
    capabilityQuery: '读取 {capability}',
    capabilityDenied: '尝试 {capability} 被拒：{reason}',
    payloadTooLarge: '下发 {capability} 被拒：帧过大（{size}）',
    drawLocked: '期望状态：禁止抽取 = {value}',
    denialNotAGroupMember: '操作者不是该组成员',
    denialNodeNotInGroup: '这台设备不属于该组',
    denialUnknownCapability: '不认识这个能力',
    denialCapabilityUnsupported: '设备没有声明这个能力',
    groupCreated: '组名「{name}」',
    groupRenamed: '改名为「{name}」',
    transferTo: '受让方：{name}',
    transferFrom: '原创建者：{name}',
    nodeRegister: {
      new: '首次登记',
      update: '设备信息更新',
      auto: '设备上线时自动登记',
      unregister: '注销登记',
    },
    
    commandRevoked: '撤销了 {capability} 的排队命令（{commandId}），设备上线后不会执行它',
  },
  actions: {
    groupCreate: '创建组',
    groupRename: '重命名组',
    
    groupDelete: '解散组',
    memberInvite: '邀请成员',
    memberJoin: '加入组',
    memberRoleChange: '变更角色',
    memberRemove: '移除成员',
    inviteCreate: '创建邀请',
    inviteRevoke: '撤销邀请',
    transferRequest: '发起转让',
    transferConfirm: '确认转让',
    transferReject: '拒绝转让',
    transferExpire: '转让超时作废',
    nodeRegister: '节点注册',
    nodePolicyChange: '下发策略',
    nodeCommandRevoke: '撤销命令',
  },
  errors: {
    insufficient_role: '你的角色不足以执行这个操作',
    group_not_found: '找不到这个组，或者你不是它的成员',
    member_not_found: '找不到这个成员',
    owner_must_use_transfer: '创建者只能通过「转让」变更，不能直接授予',
    owner_cannot_be_removed: '创建者不能被移除，否则组会变成无主状态',
    self_action_not_allowed: '不能对自己执行这个操作',
    invalid_group_name: '组名称不合法（不能为空，且不超过 64 个字符）',
    group_limit_reached: '你拥有的组已达上限（100 个），可以先把不再需要的组转让给他人',
    concurrent_modification: '这条记录刚被其他人改过，请刷新后重试',
    already_member: '你已经是该组成员',
    invite_not_found: '找不到这个邀请码，请检查是否输入正确',
    invite_expired: '邀请码已过期（创建后 72 小时内有效），请联系邀请人重新生成',
    invite_used: '这个邀请码已经被用过了（一次有效），请联系邀请人重新生成',
    invite_revoked: '邀请码已被撤销，请联系邀请人重新生成',
    invite_not_for_caller: '这个邀请码不是发给你的',
    enrollment_disabled: '服务端没有开放设备接入码（只有本地模式才会开放）',
    enrollment_code_invalid: '接入码不正确，请核对后重填',
    enrollment_code_expired: '接入码已过期（生成后 15 分钟内有效），请重新生成',
    enrollment_code_used: '这个接入码已经被用过了（一码一机），请重新生成',
    enrollment_code_revoked: '接入码已被撤销，请重新生成',
    node_mismatch: '这个接入码已经绑给了另一台设备，请换一个码或换一台机器',
    node_token_revoked: '这台设备的令牌已被撤销，需要重新接入',
    too_many_attempts: '尝试次数过多，请稍后再试',
    invite_already_member: '你已经是该组成员，无需重复加入',
    transfer_not_found: '找不到这条转让请求',
    transfer_pending: '这个组已经有一条待确认的转让请求，请先处理它',
    transfer_not_recipient: '只有受让方本人可以确认或拒绝转让',
    transfer_expired: '转让请求已超时作废，创建者没有变化',
    transfer_resolved: '这条转让请求已经被处理过了',
    





    not_revocable: '这条命令已经交给设备了，来不及撤销（设备可能已经执行）',
    command_expired: '这条命令已经过期，不用撤销：过期即丢弃，设备绝不会补执行',
    not_found: '找不到请求的内容',
    forbidden: '你没有执行这个操作的权限',
    unauthorized: '会话已过期，请重新登录',
    service_unavailable: '服务暂时不可用，请稍后重试',
    network_error: '无法连接到服务端，请检查网络后重试',
    unknown: '操作失败，请稍后重试',
  },
  notFound: {
    title: '页面不存在',
    desc: '链接可能已失效，或者你打开的地址有误',
  },
}





