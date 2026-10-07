import type { NodeCapability } from '@/api/protocol'













export interface MessageSchema {
  common: {
    appName: string
    appSubtitle: string
    loading: string
    retry: string
    cancel: string
    confirm: string
    back: string
    backToHome: string
    copyLink: string
    revoke: string
    refresh: string
    close: string
    yes: string
    no: string
  }
  language: {
    label: string
    zhCN: string
    enUS: string
    jaJP: string
  }
  



  account: {
    menu: string
    signingOut: string
    signOutFailed: string
  }
  theme: {
    toLight: string
    toDark: string
  }
  home: {
    description: string
    descriptionLocal: string
    signIn: string
    enterConsole: string
    haveInvite: string
    featuresLabel: string
    featureRealtimeTitle: string
    featureRealtimeDesc: string
    featureControlTitle: string
    featureControlDesc: string
    featureGroupTitle: string
    featureGroupDesc: string
    featureDeviceTitle: string
    featureDeviceDesc: string
    serverVersion: string
    
    copyright: string
    
    copyrightSource: string
  }
  auth: {
    signInTitle: string
    signInTitleLocal: string
    signInWithSectl: string
    signingIn: string
    signOut: string
    alreadySignedIn: string
    continueToConsole: string
    notConfiguredTitle: string
    notConfiguredDesc: string
    errors: {
      authorization_denied: string
      invalid_state: string
      missing_code: string
      login_failed: string
      unauthorized: string
      unknown: string
      service_unavailable: string
      network_error: string
      not_configured: string
    }
    
    securityNote: string
    
    password: {
      title: string
      usernameLabel: string
      usernamePlaceholder: string
      passwordLabel: string
      passwordPlaceholder: string
      submit: string
      submitting: string
      securityNote: string
      errors: {
        



        unauthorized: string
        invalid_credentials: string
        too_many_attempts: string
        auth_not_configured: string
      }
    }
  }
  





  setup: {
    title: string
    subtitle: string
    checking: string
    unavailableTitle: string
    alreadyInitializedTitle: string
    alreadyInitializedDesc: string
    goToLogin: string
    step: {
      mode: string
      displayName: string
      token: string
    }
    modeLabel: string
    chooseMode: string
    noModes: string
    displayNameLabel: string
    displayNamePlaceholder: string
    displayNameHint: string
    credentialsLabel: string
    adminUsernameLabel: string
    adminUsernamePlaceholder: string
    adminUsernameRule: string
    adminPasswordLabel: string
    adminPasswordRule: string
    confirmPasswordLabel: string
    passwordMismatch: string
    tokenLabel: string
    tokenPlaceholder: string
    tokenHint: string
    next: string
    previous: string
    submit: string
    submitting: string
    doneTitle: string
    doneDesc: string
    errors: {
      setup_token_invalid: string
      already_initialized: string
      setup_rate_limited: string
      mode_not_available: string
      admin_username_invalid: string
      admin_password_too_short: string
      not_configured: string
    }
  }
  join: {
    title: string
    subtitle: string
    codeLabel: string
    codePlaceholder: string
    pasteLinkLabel: string
    pasteLinkPlaceholder: string
    submit: string
    submitting: string
    signInFirst: string
    signInFirstLocal: string
    signInHint: string
    warning: string
    
    alreadyMemberAction: string
    noGroupYet: string
    errors: {
      expired: string
      used: string
      revoked: string
      not_found: string
      forbidden: string
      not_member_of_group: string
      
      link_without_code: string
      
      already_member: string
      unknown: string
    }
  }
  console: {
    fontCredits: string
    backToConsoleHome: string
    myGroups: string
    myGroupsEmpty: string
    emptyTitle: string
    joinCardTitle: string
    createGroup: string
    createCardDesc: string
    joinWithCode: string
    currentGroup: string
    nodes: string
    members: string
    auditLog: string
    signedInViaSectl: string
    signedInViaLocal: string
    notSignedIn: string
    checkingSession: string
    signInRequired: string
    signInRequiredDesc: string
    groupNotFound: string
    groupNotFoundDesc: string
    role: string
    
    groupQuotaHint: string
    
    joinedGroups: string
    
    noOwnedGroups: string
    
    noJoinedGroups: string
    
    sortLongPress: string
    
    sortHint: string
    sortDone: string
    sortCancel: string
    
    moveUp: string
    moveDown: string
  }
  group: {
    nodeCount: string
    online: string
    offline: string
    lastHeartbeat: string
    localRemoteDisabled: string
    drawLocked: string
    
    details: string
    





    detailPage: string
    
    displayName: string
    
    displayNameUnset: string
    
    nodeIdLabel: string
    registeredAt: string
    lockDraw: string
    unlockDraw: string
    drawLockHint: string
    drawLockUnsupported: string
    triggerDraw: string
    triggerConfirm: string
    triggerHint: string
    triggerUnsupported: string
    removeNode: string
    removeNodeHint: string
    removeNodeConfirm: string
    selectAll: string
    selected: string
    batchLock: string
    batchUnlock: string
    clearSelection: string
    skippedNodes: string
    
    batchAnnounce: string
    batchAnnouncePlaceholder: string
    batchAnnounceSend: string
    batchAnnounceHint: string
    
    batchRemove: string
    batchRemoveConfirm: string
    
    batchFailedIds: string
    
    skippedMediaNodes: string
    
    rowOk: string
    rowFailed: string
    
    viewNodeDetail: string
    filterOnline: string
    filterLocked: string
    clearFilter: string
    noMatchingNodes: string
    batchOk: string
    batchPartial: string
    batchFailed: string
    nodeControlNote: string
    memberCount: string
    noNodes: string
    noNodesHint: string
    noNodesHintLocal: string
    capabilities: string
    capabilitiesHint: string
    deviceSwitchNote: string
    units: string
    
    ownerLabel: string
    
    groupIdLabel: string
    
    youAre: string
    
    batchConfig: string
    batchConfigHint: string
    
    batchConfigNoTargets: string
  }
  





  batchConfig: {
    title: string
    subtitle: string
    backToGroup: string
    targetsTitle: string
    
    skippedUnsupported: string
    
    skippedUnknown: string
    
    offlineHint: string
    emptySelection: string
    emptySelectionHint: string
    adminRequired: string
    
    nodesFailed: string
    noTargets: string
    
    include: string
    
    keep: string
    on: string
    off: string
    
    emptyValue: string
    
    note: string
    
    readonlyNote: string
    pending: string
    none: string
    ready: string
    summaryTitle: string
    summaryEmpty: string
    submit: string
    submitting: string
    clear: string
    
    confirm: string
    problemMissing: string
    problemNotNumber: string
    problemNotOption: string
    resultTitle: string
    
    resultItems: string
  }
  





  nodeDetail: {
    backToGroup: string
    
    notFound: string
    notFoundHint: string
    overview: string
    actions: string
    platformLabel: string
    versionLabel: string
    
    tabs: {
      overview: string
      settings: string
      
      roster: string
      commands: string
    }
    
    rosterKind: {
      students: string
      prizes: string
    }
    
    summary: {
      title: string
      connection: string
      desiredLock: string
      localRemote: string
      
      localRemoteAllowed: string
      lastCommand: string
    }
    
    adminRequired: string
    
    commandStatus: string
    awaitingResult: string
    resultDetailLabel: string
    
    reasonNotWritable: string
    
    reasonBusy: string
    
    reasonUnsupportedAction: string
    desiredState: string
    revisionLabel: string
    delivered: string
    notDelivered: string
    mediaUnsupported: string
    settingsUnsupported: string
    
    mediaTitle: string
    mediaPlaceholder: string
    mediaHint: string
    mediaSend: string
    mediaEmpty: string
    mediaTooLong: string
    
    settingsTitle: string
    settingsNote: string
    
    settingsRange: string
    
    rosterModeReplace: string
    





    settingsRead: {
      title: string
      
      read: string
      reading: string
      
      hint: string
      



      deviceLanguage: string
      
      unsupported: string
      
      operatorRequired: string
      
      failed: string
      empty: string
      
      notWritable: string
      
      changes: string
      noChanges: string
      submit: string
      
      range: string
      notNumber: string
      
      notOption: string
      
      refreshed: string
      
      batched: string
      
      tooLarge: string
      





      valueUnknown: string
      






      readFirst: string
    }
    
    settingsCategory: {
      roll_call: string
      quick_draw: string
      lottery: string
      notification: string
      voice: string
    }
    
    rosterRead: {
      title: string
      read: string
      reading: string
      unsupported: string
      
      adminRequired: string
      
      failed: string
      empty: string
      
      current: string
      truncated: string
      
      truncatedHint: string
      
      members: string
      
      membersPrizes: string
      pickList: string
      editHint: string
      importNeedsList: string
      submit: string
      
      addRow: string
      removeRow: string
      noRows: string
      colId: string
      colStudentName: string
      colPrizeName: string
      colGender: string
      colGroup: string
      colEnabled: string
      colCount: string
      colWeight: string
    }
    







    client: {
      
      groups: Record<
        | 'general'
        | 'personalized'
        | 'listManagement'
        | 'picking'
        | 'notification'
        | 'history'
        | 'more'
        | 'other',
        string
      >
      navLabel: string
      categoryEmpty: string
      roster: {
        
        changeList: string
        drawerTitle: string
        drawerHint: string
        colTags: string
        colActions: string
        tagsPlaceholder: string
        importAction: string
        exportAction: string
        exportEmpty: string
        
        exported: string
      }
      import: {
        title: string
        pickFile: string
        reading: string
        unreadable: string
        sheet: string
        headerRow: string
        
        headerAuto: string
        headerNone: string
        firstRow: string
        lastRow: string
        mapping: string
        
        preview: string
        unmapped: string
        confirm: string
        hint: string
        
        skipped: string
        problemNoColumns: string
        problemEmptyRegion: string
        
        problemDuplicateId: string
        
        problemBadNumber: string
        
        problemTooManyRows: string
        columns: Record<
          'id' | 'name' | 'gender' | 'group' | 'tags' | 'enabled' | 'count' | 'weight',
          string
        >
      }
      





      hotkey: {
        
        capture: string
        
        recording: string
        
        clear: string
      }
      







      broadcast: {
        title: string
        
        hint: string
        quickDrawWindow: string
        systemVolume: string
        voiceVolume: string
        
        volumeKeep: string
        
        volumeSet: string
        
        volumeRange: string
        
        volumeInvalid: string
      }
    }
    
    commands: {
      title: string
      sessionNote: string
      empty: string
      idLabel: string
      capabilityLabel: string
      kindLabel: string
      statusLabel: string
      detailLabel: string
      
      revoke: string
      
      revokeConfirm: string
      
      revoking: string
      
      revokeDone: string
      
      revokeFailed: string
      
      revokeQueuedHint: string
    }
    





    feedback: {
      mediaDisabled: string
      
      voiceEnableFix: string
      
      voiceEnableNeedsSettings: string
      
      textTooLong: string
      textTooLongUnknown: string
      
      capabilityUnsupported: string
      capabilityUnsupportedUnknown: string
      
      supportedLabel: string
      localRemoteDisabled: string
      
      rateLimited: string
      rateLimitedUnknown: string
      notWritable: string
      
      writablePaths: string
      
      invalidValue: string
      invalidValueNoPath: string
      
      invalidValueDetail: string
      
      unsupportedActionName: string
      expired: string
      invalidCommand: string
      
      invalidCommandField: string
      
      unsupportedField: string
      
      unknown: string
      contextOnly: string
      
      rawContextLabel: string
      



      drawDenied: string
      
      drawDeniedNoCandidate: string
      
      drawDeniedClassTime: string
      
      drawDeniedNeedsLocal: string
      
      drawLocked: string
      
      drawBusy: string
      
      drawDrawing: string
      
      drawListNotFound: string
      
      drawListNotFoundNoName: string
      
      drawNoMatching: string
      
      drawCountOutOfRange: string
      
      drawnMembers: string
    }
    




    draw: {
      title: string
      
      hint: string
      
      scopeQuick: string
      
      scopeRollCall: string
      
      scopeLottery: string
      
      scopeLotteryHint: string
      





      conditions: {
        title: string
        hint: string
        
        unsupported: string
        tagsLabel: string
        
        tagsHint: string
        
        tagsEmpty: string
        studentListLabel: string
        
        studentListNone: string
        
        studentListNeedsRead: string
        readStudents: string
        
        recipientNote: string
        failedVersion: string
        failedUnsupportedField: string
        failedStudentListRequired: string
        failedStudentListNotFound: string
        failedTagsNotInList: string
        failedValueNotInList: string
        failedNoMatching: string
      }
      
      listNeedsReadPrizes: string
      
      failedLocked: string
      
      failedListNotFound: string
      
      failedLotteryCondition: string
      
      scopeQuickHint: string
      listLabel: string
      
      listNone: string
      
      listNeedsRead: string
      genderLabel: string
      groupLabel: string
      
      conditionAny: string
      countLabel: string
      
      countHint: string
      targetLabel: string
      submit: string
      drawnTitle: string
      
      drawnEmpty: string
      
      drawnList: string
      
      drawnCount: string
      
      localCheck: string
      
      localCheckOk: string
      localCheckNoCandidate: string
      
      localCheckGender: string
      
      localCheckGroup: string
      
      localCheckCount: string
      
      localCheckIncomplete: string
      localCheckTruncated: string
      
      advanced: string
      
      collapse: string
      
      legendCount: string
      
      readRoster: string
      
      reading: string
    }
    





    drawReset: {
      title: string
      
      button: string
      
      confirm: string
      
      hint: string
      
      historyNote: string
      targetLabel: string
      targetRollCall: string
      targetLottery: string
      targetQuick: string
      listLabel: string
      
      listNone: string
      
      listNeedsRead: string
      
      unsupported: string
      
      success: string
      
      failedTarget: string
      failedList: string
      
      failed: string
    }
    
    statuses: {
      queued: string
      delivered: string
      accepted: string
      completed: string
      rejected: string
      failed: string
      
      revoked: string
    }
  }
  groupForm: {
    createTitle: string
    createCardDesc: string
    nameLabel: string
    namePlaceholder: string
    nameHint: string
    creating: string
    create: string
    renameTitle: string
    rename: string
    
    renameAction: string
    renaming: string
    



    deleteTitle: string
    deleteAction: string
    deleteWarning: string
    
    deleteConfirmLabel: string
    deletePlaceholder: string
    
    deleteMismatch: string
    deleteSubmit: string
    deleting: string
  }
  members: {
    title: string
    empty: string
    you: string
    joinedAt: string
    changeRole: string
    remove: string
    removeConfirmTitle: string
    removeConfirmBody: string
    roleUpdated: string
    removed: string
    ownerBadgeHint: string
    selectRole: string
    onlyOwnerCanTransfer: string
  }
  invites: {
    title: string
    empty: string
    create: string
    createTitle: string
    roleLabel: string
    roleHint: string
    copyLink: string
    copied: string
    revoke: string
    revokeConfirmTitle: string
    revokeConfirmBody: string
    codeLabel: string
    linkLabel: string
    status: string
    createdBy: string
    expiresAt: string
    usedBy: string
    statusPending: string
    statusUsed: string
    statusExpired: string
    statusRevoked: string
  }
  transfer: {
    title: string
    description: string
    selectMember: string
    request: string
    requesting: string
    pendingTitle: string
    pendingBody: string
    waitingForRecipient: string
    incomingTitle: string
    incomingBody: string
    accept: string
    accepting: string
    reject: string
    
    expiresAt: string
    endedTitle: string
    endedBody: string
    restart: string
    confirmedTitle: string
    confirmedBody: string
    rejectedNotice: string
    twoPartyHint: string
  }
  audit: {
    title: string
    empty: string
    time: string
    action: string
    actor: string
    device: string
    outcome: string
    target: string
    
    detail: string
    
    targetMember: string
    targetNode: string
    targetInvite: string
    targetTransfer: string
    targetGroup: string
    outcomeSuccess: string
    outcomeDenied: string
    outcomeFailed: string
    restrictedHint: string
    
    total: string
    pageOf: string
    prevPage: string
    nextPage: string
    
    filterAll: string
    filterGroup: string
    filterType: string
    filterOutcome: string
    filterRange: string
    filterActorDevice: string
    filterTargetNode: string
    filterActor: string
    sourceWeb: string
    sourceApp: string
    facetsTruncated: string
    rangeAll: string
    rangeToday: string
    range7d: string
    range30d: string
    emptyFiltered: string
    export: string
    exporting: string
    exported: string
    exportTruncated: string
    exportEmpty: string
    exportFailed: string
  }
  auditDetail: {
    roleChanged: string
    removedRole: string
    joinedRole: string
    inviteRole: string
    expectedUserMismatch: string
    capabilityAction: string
    capabilityQuery: string
    capabilityDenied: string
    payloadTooLarge: string
    
    commandRevoked: string
    drawLocked: string
    denialNotAGroupMember: string
    denialNodeNotInGroup: string
    denialUnknownCapability: string
    denialCapabilityUnsupported: string
    groupCreated: string
    groupRenamed: string
    transferTo: string
    transferFrom: string
    nodeRegister: {
      new: string
      update: string
      auto: string
      unregister: string
    }
  }
  actions: {
    groupCreate: string
    groupRename: string
    





    groupDelete: string
    memberInvite: string
    memberJoin: string
    memberRoleChange: string
    memberRemove: string
    inviteCreate: string
    inviteRevoke: string
    transferRequest: string
    transferConfirm: string
    transferReject: string
    transferExpire: string
    nodeRegister: string
    nodePolicyChange: string
    
    nodeCommandRevoke: string
  }
  errors: {
    insufficient_role: string
    group_not_found: string
    member_not_found: string
    owner_must_use_transfer: string
    owner_cannot_be_removed: string
    self_action_not_allowed: string
    invalid_group_name: string
    
    group_limit_reached: string
    concurrent_modification: string
    already_member: string
    invite_not_found: string
    invite_expired: string
    invite_used: string
    invite_revoked: string
    invite_not_for_caller: string
    
    invite_already_member: string
    transfer_not_found: string
    transfer_pending: string
    transfer_not_recipient: string
    transfer_expired: string
    transfer_resolved: string
    
    not_revocable: string
    
    command_expired: string
    not_found: string
    forbidden: string
    unauthorized: string
    service_unavailable: string
    network_error: string
    unknown: string
  }
  roles: Record<'viewer' | 'operator' | 'admin' | 'owner', string>
  rolesDesc: Record<'viewer' | 'operator' | 'admin' | 'owner', string>
  capabilities: Record<NodeCapability, string>
  notFound: {
    title: string
    desc: string
  }
}
