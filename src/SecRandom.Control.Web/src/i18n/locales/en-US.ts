import type { MessageSchema } from '../types'







const messages: MessageSchema = {
  common: {
    appName: 'SecRandom Control',
    appSubtitle: 'Control Plane',
    loading: 'Loading…',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    back: 'Back',
    backToHome: 'Back to home',
    copyLink: 'Copy link',
    revoke: 'Revoke',
    refresh: 'Refresh',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
  },

  language: {
    label: 'Language',
    zhCN: '简体中文',
    enUS: 'English',
    jaJP: '日本語',
  },

  account: {
    menu: 'Account menu',
    signingOut: 'Signing out…',
    signOutFailed: 'Sign-out failed. Check your connection and try again',
  },

  theme: {
    toLight: 'Switch to light theme',
    toDark: 'Switch to dark theme',
  },

  home: {
    description:
      'Manage every SecRandom client in your classrooms from one account',
    descriptionLocal: 'Manage the SecRandom clients in every classroom',
    signIn: 'Sign in',
    enterConsole: 'Open console',
    haveInvite: 'I have an invite code',
    featuresLabel: 'Why it holds up',
    featureRealtimeTitle: 'Devices report in, you watch from the office',
    featureRealtimeDesc:
      'Classroom machines open the connection themselves, so from your office you can see which device is online and which class it is running',
    featureControlTitle: 'One click to disable, offline included',
    featureControlDesc:
      'Disable drawing instantly and re-enable it just as fast. If the device is offline, the change applies the moment it reconnects',
    featureGroupTitle: 'A group is the permission boundary',
    featureGroupDesc:
      'Split by group, invite others in, and each one manages only their own part',
    featureDeviceTitle: 'Remote never overrides the device',
    featureDeviceDesc:
      'Every classroom machine keeps a local switch and can refuse any remote control, and that holds while offline',
    serverVersion: 'Server version',
    copyright: '© {years} SECTL. All rights reserved.',
    copyrightSource: 'The year comes from the server clock, not your device',
  },

  auth: {
    signInTitle: 'Sign in with your SECTL account',
    signInTitleLocal: 'Sign in with the local administrator account',
    signInWithSectl: 'Sign in',
    signingIn: 'Redirecting to SECTL…',
    signOut: 'Sign out',
    alreadySignedIn: 'You are signed in',
    continueToConsole: 'Continue to console',
    notConfiguredTitle: 'Server authentication is not configured yet',
    notConfiguredDesc:
      'The server is missing its SECTL platform ID or redirect URI, so sign-in is unavailable. Complete the registration items in §4.1 first',
    errors: {
      authorization_denied: 'You cancelled the authorisation on the SECTL page',
      invalid_state:
        'This sign-in request has expired (the page may have been left open too long, or the link was opened twice). Please sign in again',
      missing_code: 'SECTL did not return an authorisation code. Please sign in again',
      login_failed: 'Sign-in failed: the authorisation code could not be exchanged for an identity',
      unauthorized: 'Your session has expired. Please sign in again',
      unknown: 'Something went wrong while signing in',
      service_unavailable:
        'The service is temporarily unavailable (the backend did not respond). Please try again later, or ask an administrator to check that the service is running',
      network_error: 'Could not reach the server. Check your connection and try again',
      not_configured:
        'The server has not been configured for authentication yet, so sign-in is unavailable. Ask an administrator to set the platform ID and redirect URI',
    },
    securityNote:
      'The browser only stores an opaque session identifier; SECTL access tokens stay on the server and never reach the browser',
    password: {
      title: 'Sign in with a local account',
      usernameLabel: 'Username',
      usernamePlaceholder: 'Administrator username',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Administrator password',
      submit: 'Sign in',
      submitting: 'Signing in…',
      securityNote:
        'Local-account passwords are verified by this instance only; the browser keeps nothing but an opaque session identifier',
      errors: {
        unauthorized: 'Incorrect username or password',
        invalid_credentials: 'Incorrect username or password',
        too_many_attempts: 'Too many sign-in attempts. Please wait a moment and try again',
        auth_not_configured:
          'This instance has no identity source configured, so signing in is unavailable',
      },
    },
  },

  setup: {
    title: 'Set up this instance',
    subtitle: 'A few steps bring the server up; then you sign in with a local account',
    checking: 'Checking setup status…',
    unavailableTitle: 'Setup status is currently unknown',
    alreadyInitializedTitle: 'This instance is already set up',
    alreadyInitializedDesc:
      'Running setup again would overwrite existing members and data, so the wizard is closed. Please sign in instead',
    goToLogin: 'Go to sign-in',
    step: {
      mode: 'Choose a mode',
      displayName: 'Name this instance',
      token: 'Enter the setup token',
    },
    modeLabel: 'Mode',
    chooseMode: 'Choose one of the available modes',
    noModes: 'The server offers no available mode right now. Check its configuration or version',
    displayNameLabel: 'Instance name',
    displayNamePlaceholder: 'For example: Lab 1 Control',
    displayNameHint:
      'Shown in the console title and in client connection details; you can rename it later',
    credentialsLabel: 'Administrator account',
    adminUsernameLabel: 'Administrator username',
    adminUsernamePlaceholder: '3-32 letters, digits or . _ -',
    adminUsernameRule:
      'The username must be 3-32 characters: letters, digits, dot, underscore or hyphen',
    adminPasswordLabel: 'Administrator password',
    adminPasswordRule: 'The password must be at least 8 characters and at most 128',
    confirmPasswordLabel: 'Confirm password',
    passwordMismatch: 'The two passwords do not match',
    tokenLabel: 'Setup token',
    tokenPlaceholder: 'Paste the setup token from the server log',
    tokenHint:
      'Every time the server starts while uninitialized it prints a setup token to its log. The token proves you are allowed to initialize this instance',
    next: 'Next',
    previous: 'Back',
    submit: 'Finish setup',
    submitting: 'Setting up…',
    doneTitle: 'Setup complete — you can sign in now',
    doneDesc: 'This instance is ready. Sign in with the administrator account you just created',
    errors: {
      setup_token_invalid: 'That setup token is not valid. Copy the latest one from the server log',
      already_initialized: 'This instance is already set up, so the wizard no longer applies',
      setup_rate_limited: 'Too many attempts. Please wait a while and try again',
      mode_not_available: 'That mode is not available right now. Please pick another one',
      admin_username_invalid:
        'Invalid administrator username: it must be 3-32 characters, using letters, digits, dot, underscore or hyphen',
      admin_password_too_short: 'The administrator password is too short: at least 8 characters',
      not_configured: 'The server is not set up yet. Please finish this wizard first',
    },
  },

  join: {
    title: 'Join a group',
    subtitle:
      'Paste the invite link you received, or type the invite code. The whole link is fine — the code is extracted automatically',
    codeLabel: 'Invite code or link',
    codePlaceholder: 'Type the invite code, or paste the whole invite link',
    pasteLinkLabel: 'Paste invite link',
    pasteLinkPlaceholder:
      'You can also paste the full invite link you received into the field above — the code is extracted automatically',
    submit: 'Join group',
    submitting: 'Joining…',
    signInFirst: 'Sign in with SECTL and join',
    signInFirstLocal: 'Sign in and join this group',
    signInHint:
      'After signing in you will be returned to this page to finish joining. The invite code is preserved across sign-in',
    warning: 'An invite code works once and expires 72 hours after it was created. Do not forward it to public groups',
    alreadyMemberAction: 'See my groups',
    noGroupYet: 'I have no group yet — create one',
    errors: {
      expired: 'This invite code has expired. Codes are valid for 72 hours after creation — ask the inviter to generate a new one',
      used: 'This invite code has already been used. If you are already in the group, there is nothing more to do; otherwise ask the inviter to generate a new one',
      revoked: 'This invite code was revoked. Ask the inviter to generate a new one',
      not_found: 'No such invite code. Please check what you entered',
      forbidden: 'This invite code was not issued for you',
      not_member_of_group: 'You are already a member of this group',
      link_without_code:
        'That link carries no invite code. Paste the full invite link you received (with code=…), or type the invite code',
      already_member:
        'You are already a member of this group, so you cannot join again. If the code you used was a new one, it may have been used up already',
      unknown: 'Could not join. Please try again later',
    },
  },

  console: {
    fontCredits: 'Fonts: MiSans (Xiaomi) · Icons: FluentSystemIcons (Microsoft, MIT)',
    backToConsoleHome: 'Back to console home',
    myGroups: 'My groups',
    myGroupsEmpty:
      'You do not belong to any group yet. Create one, or join someone else’s with an invite code',
    emptyTitle: 'You have not joined any group yet',
    joinCardTitle: 'Join another group',
    createGroup: 'Create group',
    createCardDesc: 'Create a group you own, then invite others to join',
    joinWithCode: 'Join with invite code',
    currentGroup: 'Current group',
    nodes: 'Nodes',
    members: 'Members',
    auditLog: 'Audit log',
    signedInViaSectl: 'Signed in via SECTL',
    signedInViaLocal: 'Signed in with a local account',
    notSignedIn: 'Not signed in',
    checkingSession: 'Checking sign-in status…',
    signInRequired: 'Sign in',
    signInRequiredDesc:
      'You are not signed in, or your session has expired. Use the button below to authorise through SECTL; you will return to this page afterwards',
    groupNotFound: 'Group not found',
    groupNotFoundDesc:
      'It may have been deleted, or you are not a member. Groups are permission boundaries — non-members see nothing',
    role: 'Role',
    groupQuotaHint:
      'Groups you own / how many you may create. Once you reach the limit, transfer the groups you no longer need to someone else',
    joinedGroups: 'Joined groups',
    noOwnedGroups: 'You have not created a group yet',
    noJoinedGroups: 'You have not joined anyone else’s group yet',
    sortLongPress: 'Long-press to reorder',
    sortHint: 'Drag, or use ↑↓ to reorder',
    sortDone: 'Done',
    sortCancel: 'Cancel',
    moveUp: 'Move up',
    moveDown: 'Move down',
  },

  group: {
    nodeCount: 'Nodes',
    online: 'Online',
    offline: 'Offline',
    lastHeartbeat: 'Last heartbeat',
    localRemoteDisabled: 'Remote control disabled on device',
    drawLocked: 'Drawing disabled',
    details: 'Details',
    detailPage: 'Detail page',
    displayName: 'Device name',
    displayNameUnset: 'Unnamed (set it on that device’s client)',
    nodeIdLabel: 'Node ID',
    registeredAt: 'First registered',
    lockDraw: 'Disable drawing',
    unlockDraw: 'Allow drawing',
    drawLockHint:
      'Desired state, not a one-off command: it applies while the device is offline and converges when it reconnects',
    drawLockUnsupported:
      'This device does not declare the “disable / allow drawing” capability, so it cannot be locked remotely',
    triggerDraw: 'Trigger a draw',
    triggerConfirm: 'Confirm draw',
    triggerHint:
      'An action command with an expiry: once expired it is dropped, never run late',
    triggerUnsupported: 'This device does not declare the “trigger one draw” capability',
    removeNode: 'Remove node',
    removeNodeHint: 'Clears this registration record only; it does not block the machine from connecting again',
    removeNodeConfirm:
      'Remove this machine’s registration record? This does not block it from reconnecting — if that member is still in the group, the machine will reappear the next time it connects',
    selectAll: 'Select all',
    selected: 'Selected',
    batchLock: 'Disable drawing',
    batchUnlock: 'Allow drawing',
    clearSelection: 'Clear selection',
    skippedNodes: '{count} device(s) do not declare the “disable / allow drawing” capability and were skipped',
    batchAnnounce: 'Announce',
    batchAnnouncePlaceholder: 'Text to announce',
    batchAnnounceSend: 'Announce',
    batchAnnounceHint:
      'Up to 200 characters, spoken by each device’s own voice engine; a device that is drawing rejects the command',
    batchRemove: 'Remove',
    batchRemoveConfirm:
      'Remove the registration records of the {count} selected device(s)? This does not block them from reconnecting — if those members are still in the group, the machines reappear the next time they connect',
    batchFailedIds: 'Failed devices: {ids}',
    skippedMediaNodes: '{count} device(s) do not declare the “media play” capability and were skipped',
    rowOk: 'Sent',
    rowFailed: 'Failed: {reason}',
    viewNodeDetail: 'Open this device’s detail page',
    filterOnline: 'Online only',
    filterLocked: 'Drawing disabled only',
    clearFilter: 'Clear filters',
    noMatchingNodes: 'No node matches the current filters',
    batchOk: 'Done: {count} device(s)',
    batchPartial: 'Partly done: {ok} succeeded, {failed} failed',
    batchFailed: 'Failed: {count} device(s)',
    nodeControlNote:
      'The on-device remote-control switch and the capability list are reported by the device itself and cannot be changed by the server; “Drawing disabled” is the desired state issued by the console — the two are different things',
    memberCount: 'Members',
    noNodes: 'No node has joined this group yet',
    noNodesHint:
      'Install the SecRandom client on a classroom machine, sign in with the same SECTL account and join this group; it will then appear here',
    noNodesHintLocal:
      'Install the SecRandom client on a classroom machine and choose to join this group; it then appears here',
    capabilities: 'Capabilities',
    capabilitiesHint:
      'Actions are filtered by the capabilities a node declares: unsupported ones are not shown, so nothing looks clickable but does nothing',
    deviceSwitchNote:
      'The “allow remote control” switch on each node is controlled by the device itself and cannot be bypassed by the server. When it is off, the node reports it',
    
    
    units: ' devices',
    ownerLabel: 'Owner',
    groupIdLabel: 'Group ID',
    youAre: 'You are',
    batchConfig: 'Unified config',
    batchConfigHint:
      'Sends settings only (no draw, announcement or lock actions): pick the items to unify and their values on a dedicated page, then push them in one go',
    batchConfigNoTargets:
      'None of the {count} selected nodes declares remote-settings support; the device would reject the push',
  },

  batchConfig: {
    title: 'Push unified configuration',
    subtitle:
      'Pick the settings to unify and set their values, then push them to the selected nodes in one go. This page only sends settings — it never triggers a draw, an announcement or a draw lock; items you do not pick stay untouched on those machines.',
    backToGroup: 'Back to group',
    targetsTitle: 'Targets',
    skippedUnsupported:
      '{count} node(s) do not declare remote-settings support and were skipped (the device would reject the push)',
    skippedUnknown:
      '{count} node(s) are not in this group’s node list and were skipped (removed, or moved to another group)',
    offlineHint:
      '{count} of them are offline: this command expires (120 seconds by default) and is dropped if it cannot be delivered — it will not be replayed when the device comes back',
    emptySelection: 'No nodes selected',
    emptySelectionHint: 'Select the machines in the group’s node list, then click “Unified config”',
    adminRequired: 'Administrator or above is required to push settings',
    nodesFailed: 'Could not load the node list: {reason}',
    noTargets:
      'None of the selected nodes declares remote-settings support; the device would reject the push',
    include: 'Send',
    keep: 'Leave as is',
    on: 'On',
    off: 'Off',
    emptyValue: 'Empty (clears it)',
    note:
      'Settings only: no draw, announcement or lock. Security, control, desktop-integration and update settings are never remotely writable',
    readonlyNote:
      '{count} item(s) cannot be changed remotely (fonts, local music library, plug-in algorithms…); they are listed but never sent',
    pending: '{count} item(s) to send',
    none: 'No settings selected yet',
    ready: '{count} setting(s) will be sent',
    summaryTitle: 'What will be sent',
    summaryEmpty: 'No settings selected yet',
    submit: 'Send to {count}',
    submitting: 'Sending…',
    clear: 'Clear selection',
    confirm: 'Send {items} setting(s) to {count} machine(s)?',
    problemMissing: '“{path}” has no value yet',
    problemNotNumber: '“{path}” needs a number',
    problemNotOption: '“{path}” must be one of: {options}',
    resultTitle: 'Result',
    resultItems: '{items} setting(s) sent',
  },

  nodeDetail: {
    backToGroup: 'Back to node list',
    notFound: 'This device is not in the node list of this group',
    notFoundHint:
      'It may have been removed, or it joined another group. A node is the result of membership plus connect-to-register, so it reappears the next time that member connects',
    overview: 'Device',
    actions: 'Node actions',
    platformLabel: 'Platform',
    versionLabel: 'Version',
    tabs: {
      overview: 'Overview',
      settings: 'Settings',
      roster: 'Rosters',
      commands: 'Command log',
    },
    rosterKind: {
      students: 'Roll-call roster',
      prizes: 'Prize pool',
    },
    summary: {
      title: 'Status summary',
      connection: 'Connection',
      desiredLock: 'Drawing switch (set by the console)',
      localRemote: 'Remote control on the device',
      localRemoteAllowed: 'The switch on the device is on, so it can be controlled remotely',
      lastCommand: 'Latest command',
    },
    adminRequired: 'Admin or above is required to change settings or push a roster remotely',
    commandStatus: 'Command receipt',
    awaitingResult: 'Waiting for the device to report back…',
    resultDetailLabel: 'Device returned',
    reasonNotWritable:
      'The device rejected this command: setting {path} cannot be changed remotely. Security settings, control settings, desktop integration (autostart, protocol registration) and update settings are never on the remote allow-list',
    reasonBusy: 'The device is drawing right now, so this command was rejected. Try again after that draw',
    reasonUnsupportedAction:
      'The device does not support this action: on-screen display is not implemented yet, only voice announcement works',
    desiredState: 'Drawing switch (desired state)',
    revisionLabel: 'Revision',
    delivered: 'Delivered to the device',
    notDelivered: 'Device offline, not delivered: the state is stored and converges when it reconnects',
    mediaUnsupported: 'This device does not declare the “media play” capability',
    settingsUnsupported: 'This device does not declare the “change settings remotely” capability',
    mediaTitle: 'Announce a sentence',
    mediaPlaceholder: 'For example: group one, please come up',
    mediaHint:
      'It only uses the device’s own voice engine (voice, volume and rate belong to that machine) and the text is never logged; on-screen display is not implemented on the client yet',
    mediaSend: 'Announce',
    mediaEmpty: 'Enter the text to announce first',
    mediaTooLong: 'The announcement cannot exceed 200 characters',
    settingsTitle: 'Change settings remotely',
    settingsNote:
      'Setting names and explanations come from the device itself, and only the fields it marks as remotely writable can be sent. Security settings, control settings, desktop integration (autostart, protocol registration) and update settings cannot be changed remotely: the device rejects any path outside its allow-list, deliberately — remote autostart or remote security policy would hand over ownership of the machine',
    settingsRange: '{min} – {max}',
    rosterModeReplace: 'Replace entirely (missing people are deleted)',
    settingsRead: {
      title: 'Settings on the device',
      read: 'Read from device',
      reading: 'Reading…',
      hint:
        "The page structure, names and explanations come from the client's own settings pages; current values, ranges and remote writability are whatever the device reports, and only the fields it marks as remotely writable can be sent",
      deviceLanguage:
        "Category names and explanations come from the client's own settings pages (shown in the console language); the device reports current values and remote writability",
      unsupported:
        'Cannot read settings: this device or server does not support “read settings” yet (no settings.read, or no read channel)',
      operatorRequired: 'Operator or above is required to read device settings',
      failed: 'Read failed: {reason}',
      empty: 'The device returned no settings category',
      notWritable: 'Cannot be changed remotely',
      changes: '{count} change(s) to send',
      noChanges: 'Nothing changed yet',
      submit: 'Send changes',
      range: '{path} must be between {min} and {max}',
      notNumber: '{path} needs a number',
      notOption: '{path} must be one of: {options}',
      refreshed: 'Re-read the device, so the form matches its current values',
      batched:
        'This device cannot return every setting in one reply (it would exceed the single-frame limit), so they were read category by category',
      tooLarge:
        'This device has too many settings: even a single category exceeds the single-frame limit, so it cannot be read',
      valueUnknown: 'Not read',
      readFirst: 'Read from the device first — only then can settings be changed',
    },
    settingsCategory: {
      roll_call: 'Roll call',
      quick_draw: 'Quick draw',
      lottery: 'Lottery',
      notification: 'Notification',
      voice: 'Voice',
    },
    rosterRead: {
      title: 'Rosters on the device',
      read: 'Read device rosters',
      reading: 'Reading…',
      unsupported:
        'Cannot read rosters: this device or server does not support “read roster” yet (no roster.read, or no read channel)',
      adminRequired: 'Admin or above is required to read device rosters',
      failed: 'Read failed: {reason}',
      empty: 'The device has no roster yet',
      current: 'In use',
      truncated: 'Truncated',
      truncatedHint:
        'The device returned only the first {count} of {total}. Replacing everything would delete the members it did not return, so prefer merge',
      members: '{count} member(s)',
      membersPrizes: '{count} prize(s)',
      pickList: 'Select a roster first',
      editHint: 'Edits stay on your side: nothing is written to the device until you send the draft',
      importNeedsList: 'Select a roster before importing a file',
      submit: 'Send draft',
      addRow: 'Add a row',
      removeRow: 'Remove this row',
      noRows: 'This roster has no members',
      colId: 'ID',
      colStudentName: 'Name',
      colPrizeName: 'Prize',
      colGender: 'Gender',
      colGroup: 'Group',
      colEnabled: 'Enabled',
      colCount: 'Count',
      colWeight: 'Weight',
    },
    






    client: {
      groups: {
        







        general: 'General Settings',
        personalized: 'Personalized Settings',
        listManagement: 'List Management',
        picking: 'Draw Settings',
        notification: 'Notification Settings',
        history: 'History',
        






        more: 'More Settings',
        other: 'Other',
      },
      navLabel: 'Settings groups',
      categoryEmpty: 'This group has no settings that can be read',
      roster: {
        changeList: 'Switch roster',
        drawerTitle: 'Select a roster',
        drawerHint: 'Pick a roster and the table on the right shows its members',
        colTags: 'Tags',
        colActions: 'Actions',
        tagsPlaceholder: 'Separate with commas',
        importAction: 'Import from file',
        exportAction: 'Export CSV',
        exportEmpty: 'The current draft is empty',
        exported: 'Exported {count} row(s)',
      },
      import: {
        title: 'Import a roster from a file',
        pickFile: 'Pick an .xlsx / .xls / .csv file',
        reading: 'Reading the file…',
        unreadable: 'Nothing could be read from this file: it may be damaged, or it is not a spreadsheet',
        sheet: 'Sheet',
        headerRow: 'Header row',
        headerAuto: 'Auto-detected (row {row})',
        headerNone: 'No header (use the fixed column order)',
        firstRow: 'First row',
        lastRow: 'Last row',
        mapping: 'Column mapping',
        preview: 'Preview (first {count} row(s))',
        unmapped: 'Not mapped',
        confirm: 'Replace the draft with this file',
        hint: 'Importing only changes the draft in the console; nothing is written to the device until you send the draft',
        skipped: 'Skipped {count} empty row(s)',
        problemNoColumns: 'No column was recognised — set the column mapping by hand',
        problemEmptyRegion: 'This range has no importable row (rows with neither an id nor a name are skipped)',
        problemDuplicateId: 'Row {row} has a duplicate id: {id}',
        problemBadNumber: 'Row {row}: the {column} is not a number',
        problemTooManyRows: 'The file has {count} row(s), more than the {max} the device accepts at a time',
        columns: {
          id: 'ID',
          name: 'Name',
          gender: 'Gender',
          group: 'Group',
          tags: 'Tags',
          enabled: 'Enabled',
          count: 'Count',
          weight: 'Weight',
        },
      },
      








      hotkey: {
        capture: 'Press shortcut',
        recording: 'Press a key combination… (Esc to cancel)',
        clear: 'Clear shortcut',
      },
      






      broadcast: {
        title: 'Broadcast options',
        hint: 'These options apply to this broadcast only and are never written back to the device settings',
        quickDrawWindow: 'Show the quick-draw window',
        systemVolume: 'System volume',
        voiceVolume: 'Announcement volume',
        volumeKeep: "Don't change",
        volumeSet: 'Set to',
        volumeRange: '0–100, restored right after the broadcast',
        volumeInvalid: 'Volume must be a whole number between {min} and {max}',
      },
    },
    commands: {
      title: 'Commands dispatched on this page',
      sessionNote:
        'Only the commands you dispatched after opening this page, newest first. Reloading clears the list; the durable record lives in the group audit log',
      empty: 'No command has been dispatched on this page yet',
      idLabel: 'Command ID',
      capabilityLabel: 'Capability',
      kindLabel: 'Kind',
      statusLabel: 'Status',
      detailLabel: 'Device returned',
      




      revoke: 'Revoke',
      revokeConfirm: 'Click again to revoke',
      revoking: 'Revoking…',
      revokeDone: 'Revoked: the device will not run this command when it comes online',
      revokeFailed: 'Could not revoke: {reason}',
      




      revokeQueuedHint:
        'The device is offline, so this command is still queued. Revoke it now and it will not run when the device comes online',
    },
    feedback: {
      mediaDisabled:
        'Voice is switched off on this machine, so a remote announcement will stay silent',
      voiceEnableFix: 'Turn voice on',
      voiceEnableNeedsSettings:
        'Turning voice on requires the “change settings remotely” capability (admin or above)',
      textTooLong: 'The device rejected this announcement: this machine allows at most {max} characters',
      textTooLongUnknown: 'The device rejected this announcement: it exceeds the length limit of that machine',
      capabilityUnsupported: 'The device refused {capability}: it does not declare that capability',
      capabilityUnsupportedUnknown: 'The device refused this command: it does not declare that capability',
      supportedLabel: 'The device declares:',
      localRemoteDisabled:
        'Remote control is switched off on this machine itself (the device turned it off; the console cannot change it)',
      rateLimited: 'The device is rate limiting: at most {max} command(s) per {window} second(s). Try again later',
      rateLimitedUnknown: 'The device is rate limiting and refused this command. Try again later',
      notWritable:
        'The device rejected this command: this setting cannot be changed remotely. Security settings, control settings, desktop integration (autostart, protocol registration) and update settings are never on the remote allow-list',
      writablePaths: 'Paths that can be changed remotely: {paths}',
      invalidValue: 'The device rejected {path}: the value is invalid and was not applied',
      invalidValueNoPath: 'The device rejected this command: the value is invalid and was not applied',
      invalidValueDetail: 'Details from the device: {detail}',
      unsupportedActionName: 'Action refused: {action}',
      expired:
        'This command expired before the device received it. Action commands are dropped once expired and never run late, so send it again',
      invalidCommand: 'The device considers this command malformed (a protocol field is missing or has the wrong type)',
      
      invalidCommandField:
        'The device rejected “{field}” in this command (missing or mistyped protocol field)',
      
      unsupportedField:
        'This device has not implemented the “{field}” option — without it the command will not fail',
      unknown: 'The device returned a reason code the console does not know yet: {code}',
      contextOnly: 'The device returned structured facts but no reason code',
      rawContextLabel: 'Raw result_context',
      




      drawDenied: 'The device refused this draw: {reason}',
      
      drawDeniedNoCandidate:
        'This machine has nobody available to draw (the list is empty, or every member is disabled)',
      
      drawDeniedClassTime:
        'This machine considers the current time class time (per its scheduling settings), so it skipped this draw',
      
      drawDeniedNeedsLocal:
        'This machine requires on-device verification (password / TOTP / USB); a remote command cannot bring up that prompt',
      
      drawLocked: 'Drawing is locked on this machine from the console — unlock it on the overview first',
      
      drawBusy: 'This machine is drawing right now; wait for that round to finish and try again',
      
      drawDrawing: 'The device is drawing right now, so its settings cannot be changed mid-round',
      






      drawListNotFound: 'The device has no list named {list}',
      
      drawListNotFoundNoName: 'That roll-call list cannot be found on the device',
      
      drawNoMatching: 'Nobody can be drawn under this condition: {field} = {value}',
      
      drawCountOutOfRange:
        'Out of range: this roster has {min}–{max} matching members — pick a number in that range',
      
      drawnMembers: 'Drew: {names}',
    },
    







    draw: {
      title: 'Draw settings',
      
      hint: 'Applies to this dispatch only; the device defaults are left untouched',
      
      scopeQuick: 'Quick draw (device default list)',
      
      scopeRollCall: 'Roll-call list',
      
      scopeLottery: 'Prize pool',
      
      scopeLotteryHint: 'Draw N prizes from the selected prize pool, without top-level gender / group',
      
      conditions: {
        title: 'Conditions',
        hint: 'Filter by prize tags or by the recipient list; applies to this draw only',
        unsupported: 'This device does not support conditional draws, so the whole pool is drawn',
        tagsLabel: 'Prize tags',
        tagsHint: 'Any matching tag is enough (multiple allowed)',
        tagsEmpty: 'This prize pool has no tags, or the pools have not been read yet',
        studentListLabel: 'Recipients',
        studentListNone: 'Not specified',
        studentListNeedsRead: 'Choosing recipients requires reading the device student lists first',
        readStudents: 'Read student lists',
        recipientNote:
          'Recipients take effect on the device; the receipt shows prize names only, never who received them',
        failedVersion: 'The device does not support this condition version; update the client',
        failedUnsupportedField: 'The device does not recognise a field in these conditions; update the console',
        failedStudentListRequired: 'Gender / group require a recipient list; pick one first',
        failedStudentListNotFound: 'That student list is not on the device; it may have been renamed or deleted',
        failedTagsNotInList: 'The selected tag is not in this prize pool; re-read the pool and pick again',
        failedValueNotInList:
          'That gender / group is not in this student list; re-read the list and pick again',
        failedNoMatching: 'Nothing matches these conditions; loosen them and try again',
      },
      
      listNeedsReadPrizes:
        'Read the device prize pools first (on the Rosters tab, or with the read button above)',
      
      failedLocked: 'Drawing is locked on this machine; unlock it with “Enable drawing” above first',
      
      failedListNotFound:
        'That roster or prize pool is not on the device; it may have been renamed or deleted',
      
      failedLotteryCondition: 'Lottery draws do not accept gender / group; remove them and try again',
      
      scopeQuickHint:
        'Sends no parameters at all, byte for byte like the old console: the device draws 1 from its own quick-draw default list',
      listLabel: 'List',
      
      listNone: 'Not specified (use the device current default list)',
      
      listNeedsRead:
        'To draw from a named list, first click “Read device lists” on the Roster tab (admin or above)',
      genderLabel: 'Gender',
      groupLabel: 'Group',
      
      conditionAny: 'Any',
      countLabel: 'Count',
      
      countHint:
        '1–{max}; asking for more than the matching members in the list makes the device refuse and report its own limit',
      targetLabel: 'Draw mode',
      submit: 'Dispatch this draw',
      drawnTitle: 'Most recent draw',
      
      drawnEmpty: 'The device did not include a draw result in its receipt',
      drawnList: 'List: {list}',
      drawnCount: 'Count: {count}',
      
      localCheck: 'On-device precheck',
      localCheckOk: 'The condition holds in this list; about {count} can be drawn',
      localCheckNoCandidate: 'This list has nobody available to draw (every member is disabled)',
      localCheckGender: 'This list has no gender “{value}”',
      localCheckGroup: 'This list has no group “{value}”',
      
      localCheckCount: 'Out of range: {min}–{max} matching members are available in this roster',
      
      localCheckIncomplete:
        'The device returned only the first {count} entries of the list ({total} in total), so the precheck may be off',
      localCheckTruncated: 'This list is truncated on the device side, so the precheck may be off',
      
      advanced: 'Show settings',
      
      collapse: 'Hide',
      
      legendCount: '{count} selected',
      
      readRoster: 'Read device rosters',
      
      reading: 'Reading…',
    },
    drawReset: {
      title: 'Reset this round',
      button: 'Reset this round',
      confirm: 'Confirm reset',
      hint: 'Clears only how far this round has progressed on that machine (who has already been drawn); history records are not deleted',
      historyNote: 'History records are not affected',
      targetLabel: 'Target',
      targetRollCall: 'Roll call',
      targetLottery: 'Lottery',
      targetQuick: 'Quick draw',
      listLabel: 'Roster',
      listNone: 'Current default roster',
      listNeedsRead: 'Read the device rosters on the Rosters tab to pick which one to reset',
      unsupported: 'This device does not declare the “reset this round” capability',
      success: 'Cleared {count} record(s) from this round',
      failedTarget: 'The device does not recognise this reset target: {reason}',
      failedList: 'That roster does not exist on the device',
      failed: 'Reset failed: {reason}',
    },
    statuses: {
      queued: 'Queued (the device is offline; delivered when it reconnects)',
      delivered: 'Handed to the device, no execution result yet',
      accepted: 'The device accepted it and is running it',
      completed: 'Completed',
      rejected: 'The device rejected it (a configuration problem, not a runtime failure)',
      failed: 'The device accepted it but execution failed',
      
      revoked: 'Revoked (the device will not run it even after it comes online)',
    },
  },

  roles: {
    viewer: 'Viewer',
    operator: 'Operator',
    admin: 'Admin',
    owner: 'Owner',
  },

  rolesDesc: {
    viewer: 'View status and summaries only',
    operator: 'Remote control: enable/disable draws, trigger draws, present results',
    admin: 'Operator plus settings, data changes, member and node management',
    owner: 'Everything, including group deletion and ownership transfer',
  },

  capabilities: {
    'node.status.read': 'Read status',
    'draw.lock': 'Disable / enable drawing',
    'draw.trigger': 'Trigger one draw',
    'draw.trigger.conditions': 'Lottery draw conditions',
    'draw.reset': 'Reset this round',
    'roster.read': 'Read roster',
    'roster.write': 'Modify roster',
    'settings.read': 'Read settings',
    'settings.write': 'Modify settings',
    'proof.list': 'Read proof list',
    'media.play': 'Present result / announce',
  },

  groupForm: {
    createTitle: 'Create group',
    createCardDesc: 'A group is roughly one administrative unit (year, campus, lab). Groups are permission boundaries: classrooms differ, so create more groups when you need isolation',
    nameLabel: 'Group name',
    namePlaceholder: 'e.g. Building 3, Floor 2',
    nameHint: 'Use “class · location” so you can tell groups apart at a glance',
    creating: 'Creating…',
    create: 'Create',
    renameTitle: 'Rename group',
    rename: 'Save',
    renameAction: 'Rename',
    renaming: 'Saving…',
    deleteTitle: 'Delete this group',
    deleteAction: 'Delete group',
    deleteWarning:
      'Every member loses access immediately; invites, node registrations, command history and draw settings are deleted with it, and none of it can be recovered. Recreating the group produces a different one (new group ID).',
    deleteConfirmLabel: 'Type the group name “{name}” to confirm',
    deletePlaceholder: 'Group name',
    deleteMismatch: 'That does not match — type the name exactly as shown above',
    deleteSubmit: 'Delete group',
    deleting: 'Deleting…',
  },
  members: {
    title: 'Members',
    empty: 'This group has no other members yet. Use “Invites” to generate a code or link and send it to someone',
    you: 'You',
    joinedAt: 'Joined',
    changeRole: 'Change role',
    remove: 'Remove',
    removeConfirmTitle: 'Remove member',
    removeConfirmBody: 'They immediately lose all permissions in this group. They can still create their own group, or rejoin with a new invite code',
    roleUpdated: 'Role updated',
    removed: 'Member removed',
    ownerBadgeHint: 'The owner can only change through transfer, cannot be removed, and cannot be granted directly',
    selectRole: 'Select role',
    onlyOwnerCanTransfer: 'Only the owner can start a transfer',
  },
  invites: {
    title: 'Invites',
    empty: 'No invites yet. Generate a code or link and send it to someone; they join after signing in and redeeming it',
    create: 'New invite',
    createTitle: 'New invite',
    roleLabel: 'Role to grant',
    roleHint: 'You can only invite roles below your own',
    copyLink: 'Copy link',
    copied: 'Link copied',
    revoke: 'Revoke',
    revokeConfirmTitle: 'Revoke invite',
    revokeConfirmBody: 'The code stops working immediately. Already redeemed invites are unaffected',
    codeLabel: 'Code',
    linkLabel: 'Invite link',
    status: 'Status',
    createdBy: 'Created by',
    expiresAt: 'Expires',
    usedBy: 'Redeemed by',
    statusPending: 'Pending',
    statusUsed: 'Redeemed',
    statusExpired: 'Expired',
    statusRevoked: 'Revoked',
  },
  transfer: {
    title: 'Transfer ownership',
    description: 'Choose a member as the new owner. You will be demoted to admin',
    selectMember: 'Select member',
    request: 'Send transfer request',
    requesting: 'Sending…',
    pendingTitle: 'Waiting for confirmation',
    pendingBody: 'The request has been sent but no permissions have changed yet. It only takes effect once the recipient confirms in their own session',
    waitingForRecipient: 'Waiting for {name} to confirm',
    incomingTitle: 'Someone wants to transfer ownership to you',
    incomingBody: 'As owner you will be able to remove any member and transfer ownership. Please make sure this is really what you want',
    accept: 'Accept and become owner',
    accepting: 'Confirming…',
    reject: 'Reject',
    expiresAt: 'Valid until {time} (it expires automatically after that)',
    endedTitle: 'The previous transfer request has ended',
    endedBody: 'The recipient rejected it, or the confirmation window ran out. No permissions changed; you can start a new request if you still need to',
    restart: 'Start a new request',
    confirmedTitle: 'You are now the owner',
    confirmedBody: 'The previous owner was demoted to admin. Only you can remove members or transfer ownership now',
    rejectedNotice: 'You rejected this transfer. No permissions changed',
    twoPartyHint: 'A transfer needs both parties to confirm',
  },
  audit: {
    title: 'Audit log',
    empty: 'No audit records yet',
    time: 'Time',
    action: 'Event',
    actor: 'Actor',
    device: 'Source device',
    outcome: 'Outcome',
    target: 'Target',
    detail: 'Details',
    targetMember: 'Member',
    targetNode: 'Device',
    targetInvite: 'Invite',
    targetTransfer: 'Transfer',
    targetGroup: 'This group',
    outcomeSuccess: 'Succeeded',
    outcomeDenied: 'Denied',
    outcomeFailed: 'Failed',
    restrictedHint: 'Audit records include member and device information, so they are visible to admins and above only',
    total: '{count} records',
    pageOf: 'Page {page} of {pages}',
    prevPage: 'Previous',
    nextPage: 'Next',
    filterAll: 'All',
    filterGroup: 'Group',
    filterType: 'Event type',
    filterOutcome: 'Outcome',
    filterRange: 'Time range',
    filterActorDevice: 'Source device',
    filterTargetNode: 'Target device',
    filterActor: 'Actor',
    sourceWeb: 'Browser session',
    sourceApp: 'App',
    facetsTruncated: 'Too many devices and actors to list: only the 500 most active are shown. Narrow the other filters to see more',
    rangeAll: 'All time',
    rangeToday: 'Today',
    range7d: 'Last 7 days',
    range30d: 'Last 30 days',
    emptyFiltered: 'No records match these filters',
    export: 'Export CSV',
    exporting: 'Exporting…',
    exported: 'Exported {count} records',
    exportTruncated: 'Too many records: only the newest {count} were exported. Narrow the filters and export again',
    exportEmpty: 'Nothing matches the current filters, so there is nothing to export',
    exportFailed: 'Export stopped and no file was created. Please try again',
  },
  auditDetail: {
    roleChanged: 'Role {from} → {to}',
    removedRole: 'Role when removed: {role}',
    joinedRole: 'Joined as {role}',
    inviteRole: 'Invited as {role}',
    expectedUserMismatch: 'This code is bound to one specific account, and the redeemer is someone else',
    capabilityAction: 'Dispatch {capability}',
    capabilityQuery: 'Read {capability}',
    capabilityDenied: '{capability} refused: {reason}',
    payloadTooLarge: '{capability} refused: frame too large ({size})',
    drawLocked: 'Desired state: drawing disabled = {value}',
    denialNotAGroupMember: 'The actor is not a member of this group',
    denialNodeNotInGroup: 'This device does not belong to the group',
    denialUnknownCapability: 'Unknown capability',
    denialCapabilityUnsupported: 'The device never declared this capability',
    groupCreated: 'Group name “{name}”',
    groupRenamed: 'Renamed to “{name}”',
    transferTo: 'Recipient: {name}',
    transferFrom: 'Previous owner: {name}',
    nodeRegister: {
      new: 'First registration',
      update: 'Device details updated',
      auto: 'Auto-registered when the device connected',
      unregister: 'Registration removed',
    },
    
    commandRevoked:
      'Revoked the queued {capability} command ({commandId}); the device will not run it when it comes online',
  },
  actions: {
    groupCreate: 'Create group',
    groupRename: 'Rename group',
    
    groupDelete: 'Dissolve group',
    memberInvite: 'Invite member',
    memberJoin: 'Join group',
    memberRoleChange: 'Change role',
    memberRemove: 'Remove member',
    inviteCreate: 'Create invite',
    inviteRevoke: 'Revoke invite',
    transferRequest: 'Request transfer',
    transferConfirm: 'Confirm transfer',
    transferReject: 'Reject transfer',
    transferExpire: 'Transfer expired',
    nodeRegister: 'Node registered',
    nodePolicyChange: 'Policy pushed',
    nodeCommandRevoke: 'Command revoked',
  },
  errors: {
    insufficient_role: 'Your role is not sufficient for this action',
    group_not_found: 'Group not found, or you are not a member of it',
    member_not_found: 'Member not found',
    owner_must_use_transfer: 'The owner role can only change through transfer',
    owner_cannot_be_removed: 'The owner cannot be removed, otherwise the group would be left without one',
    self_action_not_allowed: 'You cannot perform this action on yourself',
    invalid_group_name: 'Invalid group name (must be non-empty and at most 64 characters)',
    group_limit_reached:
      'You already own the maximum of 100 groups. Transfer any group you no longer need to someone else',
    concurrent_modification: 'This record was just changed by someone else. Refresh and try again',
    already_member: 'You are already a member of this group',
    invite_not_found: 'No such invite code. Please check what you entered',
    invite_expired:
      'This invite code has expired (valid for 72 hours after creation). Ask the inviter to generate a new one',
    invite_used:
      'This invite code has already been used (codes work once). Ask the inviter to generate a new one',
    invite_revoked: 'This invite code was revoked. Ask the inviter to generate a new one',
    invite_not_for_caller: 'This invite code was not issued for you',
    invite_already_member: 'You are already a member of this group, so there is nothing to join',
    transfer_not_found: 'Transfer request not found',
    transfer_pending: 'This group already has a pending transfer request. Resolve it first',
    transfer_not_recipient: 'Only the recipient can confirm or reject a transfer',
    transfer_expired: 'The transfer request expired; ownership is unchanged',
    transfer_resolved: 'This transfer request has already been resolved',
    





    not_revocable:
      'The command has already been handed to the device, so it is too late to revoke it (the device may have run it already)',
    command_expired:
      'The command has already expired, so there is nothing to revoke: expired commands are dropped and never run later',
    not_found: 'The requested item was not found',
    forbidden: 'You do not have permission to perform this action',
    unauthorized: 'Your session has expired. Please sign in again',
    service_unavailable: 'The service is temporarily unavailable. Please try again later',
    network_error: 'Could not reach the server. Check your connection and try again',
    unknown: 'The action failed. Please try again later',
  },
  notFound: {
    title: 'Page not found',
    desc: 'The link may have expired, or the address is wrong',
  },
}

export default messages
