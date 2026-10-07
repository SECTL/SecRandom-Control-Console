import type { MessageSchema } from '../types'


const messages: MessageSchema = {
  common: {
    appName: 'SecRandom 集控',
    appSubtitle: 'コントロールプレーン',
    loading: '読み込み中…',
    retry: '再試行',
    cancel: 'キャンセル',
    confirm: '確認',
    back: '戻る',
    backToHome: 'ホームへ戻る',
    copyLink: 'リンクをコピー',
    revoke: '無効化',
    refresh: '更新',
    close: '閉じる',
    yes: 'はい',
    no: 'いいえ',
  },

  language: {
    label: '言語',
    zhCN: '简体中文',
    enUS: 'English',
    jaJP: '日本語',
  },

  account: {
    menu: 'アカウントメニュー',
    signingOut: 'ログアウトしています…',
    signOutFailed: 'ログアウトに失敗しました。通信状況を確認して再試行してください',
  },

  theme: {
    toLight: 'ライトテーマに切り替え',
    toDark: 'ダークテーマに切り替え',
  },

  home: {
    description:
      '1 つのアカウントで、教室内のすべての SecRandom クライアントを管理できます',
    descriptionLocal: '教室のすべての SecRandom クライアントを管理できます',
    signIn: 'ログイン',
    enterConsole: 'コンソールを開く',
    haveInvite: '招待コードを持っている',
    featuresLabel: 'なぜ信頼できるのか',
    featureRealtimeTitle: '端末が自ら報告、職員室から確認',
    featureRealtimeDesc:
      '教室の端末が自ら接続を張るため、職員室からどの端末がオンラインか、どのクラスで動いているかを確認できます',
    featureControlTitle: 'ワンクリックで禁止、オフラインでも漏らさない',
    featureControlDesc:
      '禁止も解除もワンクリック。端末がオフラインでも、再接続した時点で自動的に反映されます',
    featureGroupTitle: 'グループが権限の境界',
    featureGroupDesc:
      'グループで境界を引き、他の人を招待すれば、それぞれが自分の範囲だけを管理します',
    featureDeviceTitle: '遠隔より端末が優先',
    featureDeviceDesc:
      '教室の端末はローカルのスイッチを保持し、遠隔操作を拒否できます。これはオフラインでも有効です',
    serverVersion: 'サーバー版',
    copyright: '© {years} 思拓創聯. All rights reserved.',
    copyrightSource: '年はサーバーの時刻から取得しています（端末の時計ではありません）',
  },

  auth: {
    signInTitle: '思拓创联アカウントでログイン',
    signInTitleLocal: 'ローカル管理者アカウントでログイン',
    signInWithSectl: 'ログイン',
    signingIn: '思拓创联の認可ページへ移動しています…',
    signOut: 'ログアウト',
    alreadySignedIn: 'ログイン済みです',
    continueToConsole: 'コンソールへ進む',
    notConfiguredTitle: 'サーバーの認証設定が未完了です',
    notConfiguredDesc:
      'サーバーに思拓创联のプラットフォーム ID またはコールバック URL が設定されていないため、現在ログインできません。先に §4.1 の登録項目を完了してください',
    errors: {
      authorization_denied: '思拓创联の認可ページで認可をキャンセルしました',
      invalid_state:
        'ログイン要求が無効になりました（ページを長時間開いたままにしたか、同じリンクを二度開いた可能性があります）。もう一度ログインしてください',
      missing_code: '思拓创联から認可コードが返されませんでした。もう一度ログインしてください',
      login_failed: 'ログインに失敗しました。認可コードを身元と交換できませんでした',
      unauthorized: 'セッションが期限切れです。もう一度ログインしてください',
      unknown: 'ログイン中に不明なエラーが発生しました',
      service_unavailable:
        'サービスが一時的に利用できません（バックエンドが応答しませんでした）。しばらくしてから再試行するか、管理者にサービスの起動状況をご確認ください',
      network_error: 'サーバーに接続できません。ネットワークを確認して再試行してください',
      not_configured:
        'サーバーの認証設定が未完了のため、現在ログインできません。管理者にプラットフォーム ID とコールバック URL の設定を依頼してください',
    },
    securityNote:
      'ブラウザーが保持するのは不透明なセッション識別子だけです。思拓创联のアクセストークンはサーバー側にあり、ブラウザーには渡りません',
    password: {
      title: 'ローカルアカウントでログイン',
      usernameLabel: 'ユーザー名',
      usernamePlaceholder: '管理者ユーザー名',
      passwordLabel: 'パスワード',
      passwordPlaceholder: '管理者パスワード',
      submit: 'ログイン',
      submitting: 'ログインしています…',
      securityNote:
        'ローカルアカウントのパスワードを検証するのはこのインスタンスだけです。ブラウザーに残るのは不透明なセッション識別子のみです',
      errors: {
        unauthorized: 'ユーザー名またはパスワードが正しくありません',
        invalid_credentials: 'ユーザー名またはパスワードが正しくありません',
        too_many_attempts: 'ログインの試行回数が多すぎます。しばらく待ってから再試行してください',
        auth_not_configured:
          'このインスタンスには認証元が設定されていないため、ログインできません',
      },
    },
  },

  setup: {
    title: 'このインスタンスを初期化する',
    subtitle: 'いくつかの手順でサーバーを使い始められます。完了後はローカルアカウントでログインします',
    checking: '初期化状態を確認しています…',
    unavailableTitle: '初期化状態を確認できません',
    alreadyInitializedTitle: 'このインスタンスはすでに初期化済みです',
    alreadyInitializedDesc:
      '再初期化すると既存のメンバーとデータが上書きされるため、ここではウィザードを提供しません。そのままログインしてください',
    goToLogin: 'ログインへ',
    step: {
      mode: '動作モードを選ぶ',
      displayName: 'インスタンスに名前を付ける',
      identity: 'インスタンス情報',
      token: 'セットアップトークンを入力',
    },
    modeLabel: '動作モード',
    chooseMode: '利用できる動作モードを 1 つ選んでください',
    noModes: '現在利用できる動作モードがありません。サーバーの設定またはバージョンを確認してください',
    displayNameLabel: 'インスタンス名',
    displayNamePlaceholder: '例：実験室 1 集控',
    displayNameHint: 'コンソールのタイトルとクライアントの接続情報に表示されます。後から変更できます',
    credentialsLabel: '管理者アカウント',
    adminUsernameLabel: '管理者ユーザー名',
    adminUsernamePlaceholder: '3〜32 文字の英数字、または . _ -',
    adminUsernameRule: 'ユーザー名は 3〜32 文字で、英数字・ピリオド・アンダースコア・ハイフンだけが使えます',
    adminPasswordLabel: '管理者パスワード',
    adminPasswordRule: 'パスワードは 8 文字以上 128 文字以下です',
    confirmPasswordLabel: 'パスワードの確認',
    passwordMismatch: '入力した 2 つのパスワードが一致しません',
    tokenLabel: 'セットアップトークン',
    tokenPlaceholder: 'サーバーの起動ログにあるセットアップトークンを貼り付けてください',
    tokenHint:
      '未初期化の状態でサーバーが起動するたびに、ログへセットアップトークンが出力されます。このトークンは、このインスタンスを初期化する権限があることの証明になります',
    next: '次へ',
    previous: '戻る',
    submit: '初期化を完了する',
    submitting: '初期化しています…',
    doneTitle: '初期化が完了しました。ログインできます',
    doneDesc: 'このインスタンスは利用可能です。設定した管理者アカウントでログインしてください',
    errors: {
      setup_token_invalid:
        'セットアップトークンが正しくありません。サーバーは未初期化で起動するたびに再生成するため、ログに出力された最新の文字列を確認してください。',
      already_initialized: 'このインスタンスはすでに初期化済みのため、このウィザードは無効です',
      setup_rate_limited: '試行回数が多すぎます。しばらくしてからもう一度お試しください。',
      too_many_attempts: '試行回数が多すぎます。しばらくしてからもう一度お試しください。',
      mode_not_available: 'その動作モードは現在利用できません。別のモードを選んでください',
      admin_username_invalid:
        '管理者ユーザー名が不正です：3〜32 文字で、英数字・ピリオド・アンダースコア・ハイフンだけが使えます',
      admin_password_too_short: '管理者パスワードが短すぎます：8 文字以上にしてください',
      auth_not_configured: 'サーバーに認証ソースがインストールされていないため、初期化を完了できません。',
      invalid_request: 'リクエストが不正です。インスタンス名、ユーザー名、パスワードを確認してください。',
    },
  },

  join: {
    title: 'グループに参加',
    subtitle:
      '受け取った招待リンクを貼り付けるか、招待コードを直接入力してください。リンクはそのまま貼り付けて構いません（コードは自動で取り出します）',
    codeLabel: '招待コード / 招待リンク',
    codePlaceholder: '招待コードを入力、または招待リンクをそのまま貼り付け',
    pasteLinkLabel: '招待リンクを貼り付け',
    pasteLinkPlaceholder:
      '受け取った招待リンクは、上の入力欄にそのまま貼り付けても構いません（招待コードは自動で取り出します）',
    submit: 'グループに参加',
    submitting: '参加しています…',
    signInFirst: '思拓创联アカウントでログインして参加',
    signInFirstLocal: 'ログインしてこのグループに参加',
    signInHint:
      'ログイン後は自動的にこのページへ戻り、参加手続きを続けられます。招待コードはログインをまたいで保持されます',
    warning:
      '招待コードは 1 回だけ有効で、作成から 72 時間で失効します。公開されたグループへ転送しないでください',
    alreadyMemberAction: 'マイグループを見る',
    noGroupYet: 'まだグループがない場合は作成する',
    errors: {
      expired:
        '招待コードの有効期限が切れています。作成から 72 時間で失効します。招待した人に再発行を依頼してください',
      used: 'この招待コードはすでに使用済みです。すでにグループに入っている場合は再参加の必要はありません。そうでない場合は招待した人に再発行を依頼してください',
      revoked: 'この招待コードは無効化されました。招待した人に再発行を依頼してください',
      not_found: 'その招待コードは見つかりません。入力内容を確認してください',
      forbidden: 'この招待コードはあなた宛てではありません',
      not_member_of_group: 'あなたはすでにこのグループのメンバーです',
      link_without_code:
        'このリンクには招待コードが含まれていません。受け取った招待リンク（code=… を含むもの）をそのまま貼り付けるか、招待コードを入力してください',
      already_member:
        'あなたはすでにこのグループのメンバーなので、重複して参加することはできません。新しい招待コードを使った場合は、そのコードがすでに使用済みかもしれません',
      unknown: '参加できませんでした。しばらくしてから再試行してください',
    },
  },

  console: {
    fontCredits: 'フォント：MiSans（Xiaomi）・アイコン：FluentSystemIcons（Microsoft、MIT）',
    backToConsoleHome: 'コンソールホームへ戻る',
    myGroups: 'マイグループ',
    myGroupsEmpty:
      'まだどのグループにも所属していません。「グループを作成」で新規作成するか、「招待コードで参加」から参加してください',
    emptyTitle: 'まだどのグループにも参加していません',
    joinCardTitle: '他のグループに参加',
    createGroup: 'グループを作成',
    createCardDesc: '自分が作成者となるグループを新規作成し、他の人を招待します',
    joinWithCode: '招待コードで参加',
    currentGroup: '現在のグループ',
    nodes: '端末',
    members: 'メンバー',
    auditLog: '監査ログ',
    signedInViaSectl: '思拓创联でログイン中',
    signedInViaLocal: 'ローカルアカウントでログイン中',
    notSignedIn: '未ログイン',
    checkingSession: 'ログイン状態を確認しています…',
    signInRequired: 'ログイン',
    signInRequiredDesc:
      '未ログイン、またはセッションが失効しています。下のボタンから思拓创联の認可へ進んでください。完了後はこのページに戻ります',
    groupNotFound: 'グループが見つかりません',
    groupNotFoundDesc:
      '削除されたか、あなたがメンバーではない可能性があります。グループは権限の境界です。非メンバーには何も表示されません',
    role: '権限',
    groupQuotaHint:
      '所有しているグループ / 作成できる上限。上限に達したら、不要なグループを他の人に譲渡してください',
    joinedGroups: '参加したグループ',
    noOwnedGroups: 'まだ自分で作成したグループはありません',
    noJoinedGroups: 'まだ他の人が作成したグループに参加していません',
    sortLongPress: '長押しで並べ替え',
    sortHint: 'ドラッグ、または ↑↓ で並べ替え',
    sortDone: '完了',
    sortCancel: 'キャンセル',
    moveUp: '上へ',
    moveDown: '下へ',
  },

  group: {
    nodeCount: '端末数',
    online: 'オンライン',
    offline: 'オフライン',
    lastHeartbeat: '最終ハートビート',
    localRemoteDisabled: '端末側でリモート制御を無効化中',
    drawLocked: '抽選を禁止中',
    details: '詳細',
    detailPage: '詳細ページ',
    displayName: '端末名',
    displayNameUnset: '未設定（その端末のクライアントで設定できます）',
    nodeIdLabel: 'ノード ID',
    registeredAt: '初回登録',
    lockDraw: '抽選を禁止',
    unlockDraw: '抽選を許可',
    drawLockHint:
      'これは一回限りのコマンドではなく希望状態です。端末がオフラインでも有効で、復帰時に収束します',
    drawLockUnsupported:
      'この端末は「抽選の禁止 / 許可」ケイパビリティを申告していないため、遠隔でロックできません',
    triggerDraw: '今すぐ抽選',
    triggerConfirm: '抽選を実行',
    triggerHint: '有効期限付きのアクションコマンドです。期限切れは破棄され、遅れて実行されることはありません',
    triggerUnsupported: 'この端末は「抽選を 1 回実行」ケイパビリティを申告していません',
    removeNode: 'ノードを削除',
    removeNodeHint: 'この登録記録を消すだけで、再接続を禁止するものではありません',
    removeNodeConfirm:
      'この端末の登録記録を削除しますか？再接続は防げません。そのメンバーがまだグループにいれば、次に接続した時点で再び表示されます',
    selectAll: 'すべて選択',
    selected: '選択中',
    batchLock: '一括で抽選を禁止',
    batchUnlock: '一括で抽選を許可',
    clearSelection: '選択を解除',
    skippedNodes:
      '「抽選の禁止 / 許可」ケイパビリティを申告していない端末が {count} 台あり、スキップしました',
    batchAnnounce: '一括で読み上げ',
    batchAnnouncePlaceholder: '読み上げる内容',
    batchAnnounceSend: '読み上げ',
    batchAnnounceHint:
      '200 文字まで。各端末自身の音声エンジンで読み上げます。抽選中の端末はコマンドを拒否します',
    batchRemove: '一括で削除',
    batchRemoveConfirm:
      '選択した {count} 台の登録記録を削除しますか？再接続は防げません。そのメンバーがまだグループにいれば、次に接続した時点で再び表示されます',
    batchFailedIds: '失敗した端末：{ids}',
    skippedMediaNodes: '「読み上げ」ケイパビリティを申告していない端末が {count} 台あり、スキップしました',
    rowOk: '送信しました',
    rowFailed: '失敗：{reason}',
    viewNodeDetail: 'この端末の詳細ページを開く',
    filterOnline: 'オンラインのみ',
    filterLocked: '抽選禁止のみ',
    clearFilter: '絞り込みを解除',
    noMatchingNodes: '現在の絞り込み条件に一致する端末はありません',
    batchOk: '完了：{count} 台',
    batchPartial: '一部完了：成功 {ok} 台、失敗 {failed} 台',
    batchFailed: '失敗：{count} 台',
    nodeControlNote:
      '端末側の遠隔操作スイッチとケイパビリティは端末自身が報告するもので、サーバーからは変更できません。「抽選を禁止中」は管理コンソールが送った希望状態であり、この二つは別物です',
    memberCount: 'メンバー',
    noNodes: 'このグループにはまだ端末が参加していません',
    noNodesHint:
      '教室の端末に SecRandom クライアントをインストールし、同じ 思拓创联アカウントでログインしてこのグループに参加すると、ここに表示されます',
    noNodesHintLocal:
      '教室の端末に SecRandom クライアントをインストールし、このグループへの参加を選ぶと、ここに表示されます',
    capabilities: 'ケイパビリティ',
    capabilitiesHint:
      '操作は端末が申告したケイパビリティで絞り込まれます。未対応のものは表示されないため、「押しても何も起きない」状態にはなりません',
    deviceSwitchNote:
      '各端末の「遠隔操作を許可する」スイッチは端末自身が保持しており、サーバーから回避できません。オフにすると端末はその旨を報告します',
    units: '台',
    ownerLabel: '作成者',
    groupIdLabel: 'グループ ID',
    youAre: 'あなたは',
    batchConfig: '一括設定',
    batchConfigHint:
      '設定項目のみを配信します（抽選・読み上げ・ロックなどの操作は含みません）：専用ページで統一する項目と値を選び、まとめて配信します',
    batchConfigNoTargets:
      '選択した {count} 台はいずれも「リモート設定」に対応していないため、配信は端末に拒否されます',
    enrollment: {
      title: '端末の接続',
      hint: '接続コードの有効期限は 15 分で、1 台の端末にしか使えません。コードで接続した端末は長期トークンを受け取り、以降はコードが不要になります',
      create: '接続コードを発行',
      refresh: '更新',
      newCodeTitle: '新しい接続コード（表示は 1 回だけ）',
      newCodeHint:
        '教室の端末にある SecRandom クライアントに入力してください。このページを離れるとサーバーは平文を再表示しません',
      remaining: '残り',
      expired: '期限切れ',
      copyCode: 'コードをコピー',
      copied: 'コピーしました',
      revoke: '無効化',
      revokeCodeConfirmTitle: 'この接続コードを無効化しますか？',
      revokeCodeConfirmBody: '無効化すると誰もこのコードを使えなくなります。接続済みの端末には影響しません',
      codesTitle: '接続コード',
      codesEmpty: 'まだ接続コードを発行していません',
      codePending: '未使用',
      codeUsed: '使用済み',
      codeExpired: '期限切れ',
      codeRevoked: '無効化済み',
      codeExpiresAt: '有効期限',
      devicesTitle: '端末',
      devicesEmpty: 'このグループにはまだ端末が登録されていません',
      accessEnrolled: '接続済み',
      accessNone: '未接続',
      accessExpired: 'トークン期限切れ',
      accessRevoked: 'トークン無効化済み',
      accessEnrolledCount: '接続済み {count}',
      accessNoneCount: '未接続 {count}',
      stateOnline: 'オンライン',
      stateOffline: 'オフライン',
      permissionAllowed: 'リモート操作を許可',
      permissionDenied: 'リモート操作を禁止',
      tokenExpiresAt: 'トークン有効期限',
      issueToken: 'トークンを発行',
      reissueToken: 'トークンを再発行',
      revokeToken: 'トークンを無効化',
      revokeTokenConfirmTitle: 'この端末のトークンを無効化しますか？',
      revokeTokenConfirmBody:
        '無効化すると端末はすぐに切断され、集控に戻るには接続コードで再登録が必要です',
      tokenTitle: '新しいトークン（表示は 1 回だけ）',
      tokenHint: 'すぐにコピーして端末に入力してください。このページを離れると再表示できません',
      copyToken: 'トークンをコピー',
      close: '了解',
    },
  },

  batchConfig: {
    title: '設定の一括配信',
    subtitle:
      '統一したい設定項目と値を選び、選択した端末へまとめて配信します。このページは設定のみを配信し、抽選・読み上げ・ロックは行いません。選んでいない項目は各端末でそのまま残ります。',
    backToGroup: 'グループへ戻る',
    targetsTitle: '配信先',
    skippedUnsupported:
      '{count} 台が「リモート設定」に対応していないためスキップしました（配信は端末に拒否されます）',
    skippedUnknown:
      '{count} 台がこのグループの端末一覧にないためスキップしました（削除済み、または別のグループへ移動）',
    offlineHint:
      'うち {count} 台はオフラインです：このコマンドには有効期限（既定 120 秒）があり、配信できない場合は破棄され、端末がオンラインになっても再実行されません',
    emptySelection: '端末が選択されていません',
    emptySelectionHint: 'グループの端末一覧で対象を選び、「一括設定」を押してください',
    adminRequired: '設定の配信には「管理者」以上が必要です',
    nodesFailed: '端末一覧を取得できません：{reason}',
    noTargets: '選択した端末はいずれも「リモート設定」に対応しておらず、配信は拒否されます',
    include: '配信',
    keep: '変更しない',
    on: 'オン',
    off: 'オフ',
    emptyValue: '空値（クリア）',
    note:
      '配信するのは設定のみです：抽選・読み上げ・ロックは行いません。セキュリティ・集控・デスクトップ連携・更新の設定はリモート変更できません',
    readonlyNote:
      '{count} 項目はリモート変更できません（フォント、端末内の音楽ライブラリ、プラグインのアルゴリズムなど）。一覧には表示しますが配信しません',
    pending: '配信予定 {count} 項目',
    none: '配信する設定がまだ選ばれていません',
    ready: '{count} 項目の設定を配信します',
    summaryTitle: '今回の配信内容',
    summaryEmpty: '配信する設定がまだ選ばれていません',
    submit: '{count} 台へ配信',
    submitting: '配信中…',
    clear: '選択をクリア',
    confirm: '{count} 台に {items} 項目の設定を配信します。よろしいですか？',
    problemMissing: '「{path}」の値がまだ入力されていません',
    problemNotNumber: '「{path}」には数値を入力してください',
    problemNotOption: '「{path}」は次のいずれかです：{options}',
    resultTitle: '配信結果',
    resultItems: '今回 {items} 項目の設定を配信',
  },

  nodeDetail: {
    backToGroup: '端末一覧に戻る',
    notFound: 'この端末はこのグループの端末一覧にありません',
    notFoundHint:
      'すでに削除されたか、別のグループに移動した可能性があります。ノードは「メンバー資格 + 接続時に登録」の結果なので、そのメンバーが再接続すれば再び表示されます',
    overview: '端末情報',
    actions: '端末の操作',
    platformLabel: 'プラットフォーム',
    versionLabel: 'バージョン',
    tabs: {
      overview: '概要',
      settings: '設定',
      roster: '名簿',
      commands: 'コマンド履歴',
    },
    rosterKind: {
      students: '点呼名簿',
      prizes: '抽選賞品',
    },
    summary: {
      title: '状態のまとめ',
      connection: '接続',
      desiredLock: '抽選スイッチ（コンソールから設定）',
      localRemote: '端末側の遠隔操作',
      localRemoteAllowed: '端末側のスイッチはオンで、遠隔操作を受け付けます',
      lastCommand: '直近のコマンド',
    },
    adminRequired: '遠隔での設定変更と名簿配信には「管理人」以上が必要です',
    commandStatus: 'コマンドの結果',
    awaitingResult: '端末からの結果を待っています…',
    resultDetailLabel: '端末の応答',
    reasonNotWritable:
      '端末がこのコマンドを拒否しました：設定 {path} は遠隔から変更できません。セキュリティ設定・集控設定・デスクトップ統合（自動起動、プロトコル登録）・更新設定は遠隔の許可リストに入っていません',
    reasonBusy: '端末が抽選中で、このコマンドは拒否されました。その抽選が終わってから送信してください',
    reasonUnsupportedAction:
      '端末がこのアクションに対応していません：画面表示は未実装で、読み上げのみ可能です',
    desiredState: '抽選スイッチ（希望状態）',
    revisionLabel: 'リビジョン',
    delivered: '端末へ配信済み',
    notDelivered: '端末はオフラインのため未配信。状態は保存済みで、復帰時に収束します',
    mediaUnsupported: 'この端末は「読み上げ」ケイパビリティを申告していません',
    settingsUnsupported: 'この端末は「遠隔での設定変更」ケイパビリティを申告していません',
    mediaTitle: 'ひとこと読み上げ',
    mediaPlaceholder: '例：第 1 班は前に来てください',
    mediaHint:
      '端末自身の音声エンジンのみを使用します（声色・音量・速度はその端末の設定）。本文はログに残しません。画面表示はクライアント側で未実装です',
    mediaSend: '読み上げ',
    mediaEmpty: '読み上げる内容を入力してください',
    mediaTooLong: '読み上げ内容は 200 文字までです',
    settingsTitle: '遠隔で設定を変更',
    settingsNote:
      '設定項目の名前と説明は端末自身が提示し、遠隔変更可とされた項目だけを送信できます。セキュリティ設定・集控設定・デスクトップ統合（自動起動、プロトコル登録）・更新設定は遠隔からは変更できません：端末は許可リスト外のパスを拒否します。これは意図的な設計です（遠隔で自動起動やセキュリティ方針を変えられるなら、端末の所有権を渡すことになります）',
    settingsRange: '{min} ~ {max}',
    rosterModeReplace: '全体を置き換え（不足する人は削除）',
    settingsRead: {
      title: '端末の現在の設定',
      read: '端末から読み取る',
      reading: '読み取り中…',
      hint:
        'ページの構成・名称・説明はクライアント自身の設定ページのもので、現在値・範囲・「遠隔変更の可否」は端末の報告どおりです。遠隔変更可とされた項目だけを送信できます',
      deviceLanguage:
        'カテゴリ名と説明はクライアント自身の設定ページのもの（コンソールの言語で表示）。現在値と遠隔変更の可否は端末から取得します',
      unsupported:
        '設定を読み取れません：この端末またはサーバーは「設定の読み取り」に対応していません（settings.read もしくは読み取りチャネルがありません）',
      operatorRequired: '端末の設定を読み取るには「操作者」以上が必要です',
      failed: '読み取りに失敗しました：{reason}',
      empty: '端末は設定カテゴリを返しませんでした',
      notWritable: '遠隔では変更できません',
      changes: '送信する変更 {count} 件',
      noChanges: 'まだ変更はありません',
      submit: '変更を送信',
      range: '{path} は {min} ~ {max} の範囲である必要があります',
      notNumber: '{path} には数値が必要です',
      notOption: '{path} は次のいずれかである必要があります：{options}',
      refreshed: '端末を読み直し、表示を現在の値に合わせました',
      batched:
        'この端末は設定を一度に返せません（応答が 1 フレームの上限を超えます）。カテゴリごとに分けて読み取りました',
      tooLarge:
        'この端末は設定が多すぎます。1 カテゴリの応答でも 1 フレームの上限を超えるため読み取れません',
      valueUnknown: '未取得',
      readFirst: '先に「端末から読み取り」を行ってから変更できます',
    },
    settingsCategory: {
      roll_call: '点呼',
      quick_draw: 'クイック抽選',
      lottery: '抽選',
      notification: '通知',
      voice: '音声',
    },
    rosterRead: {
      title: '端末上の名簿',
      read: '端末の名簿を読み取る',
      reading: '読み取り中…',
      unsupported:
        '名簿を読み取れません：この端末またはサーバーは「名簿の読み取り」に対応していません（roster.read もしくは読み取りチャネルがありません）',
      adminRequired: '端末の名簿を読み取るには「管理人」以上が必要です',
      failed: '読み取りに失敗しました：{reason}',
      empty: '端末にはまだ名簿がありません',
      current: '使用中',
      truncated: '切り詰め',
      truncatedHint:
        '端末は {total} 件のうち先頭 {count} 件だけを返しました。全体を置き換えると返されなかった人が削除されるため、「追加と更新のみ」を推奨します',
      members: '{count} 人',
      membersPrizes: '{count} 件の賞品',
      pickList: '先に名簿を選択してください',
      editHint: '編集はこの画面だけの下書きです。「下書きを配信」を押すまで端末には書き込まれません',
      importNeedsList: 'ファイルを取り込む前に名簿を選択してください',
      submit: '下書きを配信',
      addRow: '行を追加',
      removeRow: 'この行を削除',
      noRows: 'この名簿にはメンバーがいません',
      colId: 'ID',
      colStudentName: '氏名',
      colPrizeName: '賞品名',
      colGender: '性別',
      colGroup: 'グループ',
      colEnabled: '有効',
      colCount: '数量',
      colWeight: '重み',
    },
    






    client: {
      groups: {
        






        general: '一般設定',
        personalized: '個人設定',
        listManagement: '名簿管理',
        picking: '抽選設定',
        notification: '通知設定',
        history: '履歴',
        






        more: 'その他の設定',
        other: 'その他',
      },
      navLabel: '設定グループ',
      categoryEmpty: 'このグループに読み取りできる設定項目はありません',
      roster: {
        changeList: '名簿を切り替え',
        drawerTitle: '名簿を選択',
        drawerHint: '名簿を選ぶと、右側の表にそのメンバーが表示されます',
        colTags: 'タグ',
        colActions: '操作',
        tagsPlaceholder: 'カンマ区切り',
        importAction: 'ファイルから取り込む',
        exportAction: 'CSV に書き出す',
        exportEmpty: '現在の下書きは空です',
        exported: '{count} 行を書き出しました',
      },
      import: {
        title: 'ファイルから名簿を取り込む',
        pickFile: '.xlsx / .xls / .csv ファイルを選択',
        reading: 'ファイルを読み取り中…',
        unreadable: 'このファイルから内容を読み取れません：破損しているか、表形式のファイルではありません',
        sheet: 'シート',
        headerRow: 'ヘッダー行',
        headerAuto: '自動判定（{row} 行目）',
        headerNone: 'ヘッダーなし（固定の列順）',
        firstRow: '開始行',
        lastRow: '終了行',
        mapping: '列の対応',
        preview: 'プレビュー（先頭 {count} 行）',
        unmapped: '未対応',
        confirm: 'このファイルで下書きを置き換える',
        hint: '取り込みで変わるのはコンソール内の下書きだけです。「下書きを配信」を押すまで端末には書き込まれません',
        skipped: '空行 {count} 行をスキップしました',
        problemNoColumns: '列を 1 つも判別できませんでした。列の対応を手動で指定してください',
        problemEmptyRegion: 'この範囲には取り込める行がありません（番号と氏名がどちらも空の行はスキップされます）',
        problemDuplicateId: '{row} 行目の番号が重複しています：{id}',
        problemBadNumber: '{row} 行目の{column}が数値ではありません',
        problemTooManyRows: 'ファイルには {count} 行あり、端末が一度に受け付けられる {max} 行を超えています',
        columns: {
          id: 'ID',
          name: '氏名',
          gender: '性別',
          group: 'グループ',
          tags: 'タグ',
          enabled: '有効',
          count: '数量',
          weight: '重み',
        },
      },
      







      hotkey: {
        capture: 'ショートカットを入力',
        recording: 'キーの組み合わせを押してください…（Esc でキャンセル）',
        clear: 'ショートカットを消去',
      },
      






      broadcast: {
        title: '読み上げオプション',
        hint: 'これらのオプションは今回の読み上げにだけ適用され、端末の設定には書き戻しません',
        quickDrawWindow: 'クイック抽選ウィンドウを表示',
        systemVolume: 'システム音量',
        voiceVolume: '読み上げ音量',
        volumeKeep: '変更しない',
        volumeSet: '設定する',
        volumeRange: '0〜100。読み上げ終了後に元の値へ戻します',
        volumeInvalid: '音量は {min}〜{max} の整数で入力してください',
      },
    },
    commands: {
      title: 'このページでのコマンド履歴',
      sessionNote:
        'このページを開いた後に送信したコマンドだけを、新しい順に表示します。再読み込みで消えます。正式な記録はグループの「監査」に残ります',
      empty: 'このページではまだコマンドを送信していません',
      idLabel: 'コマンド ID',
      capabilityLabel: 'ケイパビリティ',
      kindLabel: '種類',
      statusLabel: '状態',
      detailLabel: '端末の応答',
      



      revoke: '取り消す',
      revokeConfirm: 'もう一度押して取り消す',
      revoking: '取り消し中…',
      revokeDone: '取り消しました：端末がオンラインになってもこのコマンドは実行されません',
      revokeFailed: '取り消しに失敗しました：{reason}',
      



      revokeQueuedHint:
        '端末がオフラインのため、このコマンドはまだ待機中です。今取り消せば、端末がオンラインになっても実行されません',
    },
    feedback: {
      mediaDisabled: 'この端末は音声の総合スイッチが切られているため、遠隔の読み上げは音が出ません',
      voiceEnableFix: '音声をオンにする',
      voiceEnableNeedsSettings:
        '音声をオンにするには「遠隔での設定変更」ケイパビリティ（管理人以上）が必要です',
      textTooLong: '端末がこの読み上げを拒否しました：この端末は最大 {max} 文字までです',
      textTooLongUnknown: '端末がこの読み上げを拒否しました：その端末の文字数上限を超えています',
      capabilityUnsupported: '端末が {capability} を拒否しました：このケイパビリティを申告していません',
      capabilityUnsupportedUnknown: '端末がこのコマンドを拒否しました：このケイパビリティを申告していません',
      supportedLabel: '端末が申告しているもの：',
      localRemoteDisabled: 'この端末は本体のスイッチが切れています（端末自身が切ったもので、コンソールからは変更できません）',
      rateLimited: '端末が制限中です：{window} 秒あたり最大 {max} 件のコマンドです。しばらくしてから再試行してください',
      rateLimitedUnknown: '端末が制限中で、このコマンドは拒否されました。しばらくしてから再試行してください',
      notWritable:
        '端末がこのコマンドを拒否しました：この設定項目は遠隔から変更できません。セキュリティ設定・集控設定・デスクトップ統合（自動起動、プロトコル登録）・更新設定は遠隔の許可リストに入っていません',
      writablePaths: '遠隔で変更できるパス：{paths}',
      invalidValue: '端末が {path} を拒否しました：値が不正なため適用されませんでした',
      invalidValueNoPath: '端末がこのコマンドを拒否しました：値が不正なため適用されませんでした',
      invalidValueDetail: '端末からの詳細：{detail}',
      unsupportedActionName: '拒否されたアクション：{action}',
      expired:
        'このコマンドは端末が受け取る前に期限切れになりました。アクションコマンドは期限切れで破棄され、遅れて実行されることはありません。もう一度送信してください',
      invalidCommand: '端末はこのコマンド自体が不正だと判断しました（プロトコルのフィールド欠落か型の不一致）',
      
      invalidCommandField:
        '端末はこのコマンドの「{field}」を不正と判定しました（プロトコルフィールドの欠落または型違い）',
      
      unsupportedField: 'この端末は「{field}」オプションを実装していません。指定しなければ失敗しません',
      unknown: 'コンソールがまだ知らない理由コードが端末から返されました：{code}',
      contextOnly: '端末は構造化された結果を返しましたが、理由コードはありません',
      rawContextLabel: '生の result_context',
      




      drawDenied: '端末が今回の抽選を拒否しました：{reason}',
      
      drawDeniedNoCandidate:
        'この端末には抽選できる人がいません（リストが空か、全員が無効になっています）',
      
      drawDeniedClassTime: 'この端末は現在を授業時間と判定しました（連携設定）。今回は抽選しません',
      
      drawDeniedNeedsLocal:
        'この端末はその場での本機認証（パスワード / TOTP / USB）を要求します。遠隔コマンドでは認証画面を開けません',
      
      drawLocked: 'この端末の抽選はコンソール側でロックされています。先に概要画面で解除してください',
      
      drawBusy: 'この端末は抽選中です。この回が終わってから再試行してください',
      
      drawDrawing: '端末が抽選中のため、途中で設定を変更できません',
      






      drawListNotFound: '端末に「{list}」という名前のリストはありません',
      
      drawListNotFoundNoName: '端末にこの点呼リストが見つかりません',
      
      drawNoMatching: 'この条件で抽選できる人がいません：{field} = {value}',
      
      drawCountOutOfRange:
        '人数が範囲外です：この名簿で条件に合うのは {min}–{max} 人です。その範囲で指定してください',
      
      drawnMembers: '抽選結果：{names}',
    },
    







    draw: {
      title: '抽選設定',
      
      hint: '今回の送信にだけ適用され、端末側の既定設定は変更しません',
      
      scopeQuick: 'クイック抽選（端末の既定リスト）',
      
      scopeRollCall: '点呼リスト',
      
      scopeLottery: '賞品プール',
      
      scopeLotteryHint: '選んだ賞品プールから N 件を抽選します（最上位の性別 / グループは送りません）',
      
      conditions: {
        title: '絞り込み条件',
        hint: '賞品タグまたは配布先で絞り込みます。今回の配信だけに適用されます',
        unsupported: 'この端末は条件付き抽選に対応していないため、賞品プール全体から抽選します',
        tagsLabel: '賞品タグ',
        tagsHint: 'いずれかのタグに一致すれば対象です（複数選択可）',
        tagsEmpty: 'この賞品プールにタグがないか、まだ読み取っていません',
        studentListLabel: '配布先',
        studentListNone: '指定しない',
        studentListNeedsRead: '配布先を指定するには、先に端末の学生名簿を読み取ってください',
        readStudents: '学生名簿を読み取る',
        recipientNote: '配布先は端末側でのみ有効です：回執には賞品名だけが表示され、誰に配られたかは分かりません',
        failedVersion: '端末がこの条件バージョンに対応していません。端末側を更新してください',
        failedUnsupportedField: '端末が条件内のフィールドを認識しません。コンソールを更新してください',
        failedStudentListRequired: '性別 / グループを指定するには配布先の名簿が必要です',
        failedStudentListNotFound: 'その学生名簿は端末にありません。名前変更や削除の可能性があります',
        failedTagsNotInList: '選んだタグはこの賞品プールにありません。再読み取りして選び直してください',
        failedValueNotInList:
          'その性別 / グループはこの学生名簿にありません。再読み取りして選び直してください',
        failedNoMatching: 'この条件では対象がありません。条件を緩めて再試行してください',
      },
      
      listNeedsReadPrizes:
        '先に端末の賞品プールを読み取ってください（「名簿」タブ、または上の読み取りボタン）',
      
      failedLocked: 'この端末は抽選が禁止されています。上の「抽選を許可」で解除してください',
      
      failedListNotFound:
        'その名簿または賞品プールは端末にありません。名前が変更または削除された可能性があります',
      
      failedLotteryCondition: '抽選は性別 / グループを受け付けません。外してから再送してください',
      
      scopeQuickHint:
        'パラメータを一切送らず、旧コンソールとまったく同じ動作です：端末自身のクイック抽選の既定リストから 1 人を抽選します',
      listLabel: 'リスト',
      
      listNone: '指定しない（端末の現在の既定リストを使用）',
      
      listNeedsRead:
        'リストを指定して抽選するには、先に「名簿」タブで「端末のリストを読み取る」を押してください（管理人以上が必要）',
      genderLabel: '性別',
      groupLabel: 'グループ',
      
      conditionAny: '指定なし',
      countLabel: '人数',
      
      countHint: '1–{max}；リスト内で条件に合う人数を超えると、端末が拒否して上限を通知します',
      targetLabel: '抽選方法',
      submit: 'この抽選を送信',
      drawnTitle: '直近の抽選',
      
      drawnEmpty: '端末の応答に抽選結果が含まれていません',
      drawnList: 'リスト：{list}',
      drawnCount: '人数：{count}',
      
      localCheck: '本機での事前確認',
      localCheckOk: '条件はこのリストで成立しています。約 {count} 人を抽選できます',
      localCheckNoCandidate: 'このリストには抽選できる人がいません（全員が無効です）',
      localCheckGender: 'このリストに性別「{value}」の人はいません',
      localCheckGroup: 'このリストにグループ「{value}」の人はいません',
      
      localCheckCount: '人数が範囲外です：条件に合うのは {min}–{max} 人です',
      
      localCheckIncomplete:
        '端末はリストの先頭 {count} 件（全 {total} 件）しか返していないため、事前確認が正確でない可能性があります',
      localCheckTruncated:
        'このリストは端末側で切り詰められているため、事前確認が正確でない可能性があります',
      
      advanced: '設定を開く',
      
      collapse: '閉じる',
      
      legendCount: '{count} 人',
      
      readRoster: '端末の名簿を読み取る',
      
      reading: '読み取り中…',
    },
    drawReset: {
      title: '今回のリセット',
      button: '今回のリセット',
      confirm: 'リセットを確認',
      hint: 'この端末の今回の抽選進行（誰をすでに引いたか）だけを消します。履歴は削除しません',
      historyNote: '履歴には影響しません',
      targetLabel: '対象',
      targetRollCall: '点呼',
      targetLottery: '抽選',
      targetQuick: 'クイック抽選',
      listLabel: '名簿',
      listNone: '現在の既定の名簿',
      listNeedsRead: '「名簿」タブで端末の名簿を読み取ると、リセットする名簿を指定できます',
      unsupported: 'この端末は「今回のリセット」ケイパビリティを申告していません',
      success: '今回の記録を {count} 件リセットしました',
      failedTarget: '端末がこのリセット対象を認識しません：{reason}',
      failedList: 'その名簿は端末にありません',
      failed: 'リセットに失敗しました：{reason}',
    },
    statuses: {
      queued: '待機中（端末がオフライン。復帰時に配信されます）',
      delivered: '端末へ配信済み。実行結果はまだありません',
      accepted: '端末が受理し、実行中です',
      completed: '実行完了',
      rejected: '端末が拒否しました（設定の問題であり、実行時の障害ではありません）',
      failed: '端末は受理しましたが実行に失敗しました',
      
      revoked: '取り消し済み（端末が復帰しても実行されません）',
    },
  },

  roles: {
    viewer: '閲覧者',
    operator: '操作者',
    admin: '管理人',
    owner: '作成者',
  },

  rolesDesc: {
    viewer: '状態と集計の閲覧のみ',
    operator: '遠隔操作：抽選の許可・禁止、抽選の実行、結果の表示',
    admin: '操作者に加えて設定・データの変更、メンバーと端末登録の管理',
    owner: 'すべての権限（グループ削除と譲渡を含む）',
  },

  capabilities: {
    'node.status.read': '状態の読み取り',
    'draw.lock': '抽選の禁止 / 許可',
    'draw.trigger': '抽選を 1 回実行',
    'draw.trigger.conditions': '抽選の絞り込み条件',
    'draw.reset': '今回のリセット',
    'roster.read': '名簿の読み取り',
    'roster.write': '名簿の変更',
    'settings.read': '設定の読み取り',
    'settings.write': '設定の変更',
    'proof.list': '証明一覧の読み取り',
    'media.play': '結果の表示 / 読み上げ',
  },

  groupForm: {
    createTitle: 'グループを作成',
    createCardDesc: 'グループはおおよそ 1 つの管理単位（学年・校舎・PC 室）です。グループは権限の境界です。教室ごとに担当者が違うため、分離したいときはグループを増やします',
    nameLabel: 'グループ名',
    namePlaceholder: '例：3 号館 2 階',
    nameHint: '「クラス · 場所」にすると、複数のグループを見分けやすくなります',
    creating: '作成しています…',
    create: '作成',
    renameTitle: 'グループ名を変更',
    rename: '保存',
    renameAction: '名前を変更',
    renaming: '保存しています…',
    deleteTitle: 'このグループを解散',
    deleteAction: 'グループを解散',
    deleteWarning:
      '解散すると、全メンバーがすぐにアクセスできなくなります。招待コード、ノード登録、コマンド履歴、抽選設定もまとめて削除され、元に戻せません。作り直しても別のグループになります（グループ ID が変わります）。',
    deleteConfirmLabel: '確認のためグループ名「{name}」を入力してください',
    deletePlaceholder: 'グループ名',
    deleteMismatch: '名前が一致しません。上に表示された名前をそのまま入力してください',
    deleteSubmit: '解散する',
    deleting: '解散しています…',
  },
  members: {
    title: 'メンバー',
    empty: 'このグループにはまだ他のメンバーがいません。「招待」でコードかリンクを発行して他の人に送ってください',
    you: 'あなた',
    joinedAt: '参加日時',
    changeRole: '権限を変更',
    remove: '削除',
    removeConfirmTitle: 'メンバーを削除',
    removeConfirmBody: '削除すると、そのアカウントはこのグループのすべての権限を即座に失います。自分でグループを作るか、新しい招待コードで再参加できます',
    roleUpdated: '権限を更新しました',
    removed: 'メンバーを削除しました',
    ownerBadgeHint: '作成者は「譲渡」でのみ変更できます。削除できず、他人に直接付与することもできません',
    selectRole: '権限を選択',
    onlyOwnerCanTransfer: '譲渡を開始できるのは作成者だけです',
  },
  invites: {
    title: '招待',
    empty: 'まだ招待がありません。コードかリンクを発行して他の人に送ってください。ログイン後に交換すると参加できます',
    create: '招待を作成',
    createTitle: '招待を作成',
    roleLabel: '付与する権限',
    roleHint: '自分より下の権限だけを招待できます',
    copyLink: 'リンクをコピー',
    copied: 'リンクをコピーしました',
    revoke: '無効化',
    revokeConfirmTitle: '招待を無効化',
    revokeConfirmBody: 'この招待コードは即座に使えなくなります。すでに交換済みのものは影響を受けません',
    codeLabel: '招待コード',
    linkLabel: '招待リンク',
    status: '状態',
    createdBy: '作成者',
    expiresAt: '有効期限',
    usedBy: '交換した人',
    statusPending: '未交換',
    statusUsed: '交換済み',
    statusExpired: '期限切れ',
    statusRevoked: '無効化済み',
  },
  transfer: {
    title: '作成者を譲渡',
    description: '新しい作成者となるメンバーを選んでください。譲渡後、あなたは管理者に降格します',
    selectMember: 'メンバーを選択',
    request: '譲渡リクエストを送信',
    requesting: '送信しています…',
    pendingTitle: '相手の確認待ち',
    pendingBody: 'リクエストを送信しましたが、権限はまだ何も変わっていません。相手が自分のセッションで確認して初めて有効になります',
    waitingForRecipient: '{name} の確認を待っています',
    incomingTitle: '作成者をあなたに譲渡しようとしています',
    incomingBody: '作成者になると、任意のメンバーの削除や作成者の譲渡などすべての権限を持ちます。本当に受けるか確認してください',
    accept: '承認して作成者になる',
    accepting: '確認しています…',
    reject: '拒否',
    expiresAt: '有効期限 {time}（過ぎると自動的に無効になります）',
    endedTitle: '前回の譲渡リクエストは終了しました',
    endedBody: '相手が拒否したか、確認期限を過ぎました。権限は何も変わっていません。必要ならもう一度開始できます',
    restart: 'もう一度開始する',
    confirmedTitle: 'あなたが作成者になりました',
    confirmedBody: '元の作成者は管理人に降格しました。メンバーの削除や再譲渡ができるのはあなただけです',
    rejectedNotice: 'この譲渡を拒否しました。権限は何も変わっていません',
    twoPartyHint: '譲渡には双方の確認が必要です',
  },
  audit: {
    title: '監査ログ',
    empty: 'まだ監査記録がありません',
    time: '日時',
    action: 'イベント',
    actor: '実行者',
    device: '実行端末',
    outcome: '結果',
    target: '対象',
    detail: '詳細',
    targetMember: 'メンバー',
    targetNode: '端末',
    targetInvite: '招待',
    targetTransfer: '譲渡',
    targetGroup: 'このグループ',
    outcomeSuccess: '成功',
    outcomeDenied: '拒否',
    outcomeFailed: '失敗',
    restrictedHint: '監査にはメンバーと端末の情報が含まれるため、管理人以上のみ閲覧できます',
    total: '全 {count} 件',
    pageOf: '{pages} ページ中 {page} ページ目',
    prevPage: '前へ',
    nextPage: '次へ',
    filterAll: 'すべて',
    filterGroup: 'グループ',
    filterType: 'イベント種別',
    filterOutcome: '結果',
    filterRange: '期間',
    filterActorDevice: '実行端末',
    filterTargetNode: '操作対象の端末',
    filterActor: '実行者',
    sourceWeb: 'ブラウザーセッション',
    sourceApp: 'アプリ',
    facetsTruncated: '端末と実行者の候補が多すぎます。使用回数の多い上位 500 件のみ表示しています。他の条件で絞り込んでください',
    rangeAll: '全期間',
    rangeToday: '今日',
    range7d: '過去 7 日間',
    range30d: '過去 30 日間',
    emptyFiltered: '条件に一致する記録がありません',
    export: 'CSV を書き出す',
    exporting: '書き出し中…',
    exported: '{count} 件を書き出しました',
    exportTruncated: '記録が多すぎます。新しい {count} 件のみ書き出しました。絞り込んでから再度お試しください',
    exportEmpty: '現在の条件に記録がないため、書き出せる内容がありません',
    exportFailed: '書き出しが中断され、ファイルは作成されませんでした。もう一度お試しください',
  },
  auditDetail: {
    roleChanged: 'ロール {from} → {to}',
    removedRole: '削除時のロール：{role}',
    joinedRole: '{role} として参加',
    inviteRole: '招待ロール：{role}',
    expectedUserMismatch: 'この招待コードは特定のアカウント専用で、使用したのは本人ではありません',
    capabilityAction: '{capability} を送信',
    capabilityQuery: '{capability} を読み取り',
    capabilityDenied: '{capability} は拒否されました：{reason}',
    payloadTooLarge: '{capability} は拒否されました：フレームが大きすぎます（{size}）',
    drawLocked: '希望状態：抽選の禁止 = {value}',
    denialNotAGroupMember: '実行者がこのグループのメンバーではありません',
    denialNodeNotInGroup: 'この端末はグループに属していません',
    denialUnknownCapability: '不明なケイパビリティです',
    denialCapabilityUnsupported: '端末がこのケイパビリティを宣言していません',
    groupCreated: 'グループ名「{name}」',
    groupRenamed: '「{name}」に改名',
    transferTo: '譲渡先：{name}',
    transferFrom: '元の作成者：{name}',
    nodeRegister: {
      new: '初回登録',
      update: '端末情報を更新',
      auto: '端末の接続時に自動登録',
      unregister: '登録を解除',
    },
    
    commandRevoked:
      '待機中だった {capability} のコマンド（{commandId}）を取り消しました。端末がオンラインになっても実行されません',
  },
  actions: {
    groupCreate: 'グループ作成',
    groupRename: 'グループ名変更',
    
    groupDelete: 'グループ解散',
    memberInvite: 'メンバー招待',
    memberJoin: 'グループ参加',
    memberRoleChange: '権限変更',
    memberRemove: 'メンバー削除',
    inviteCreate: '招待作成',
    inviteRevoke: '招待無効化',
    transferRequest: '譲渡リクエスト',
    transferConfirm: '譲渡承認',
    transferReject: '譲渡拒否',
    transferExpire: '譲渡が期限切れ',
    nodeRegister: '端末登録',
    nodePolicyChange: 'ポリシー配信',
    nodeCommandRevoke: 'コマンド取消',
  },
  errors: {
    insufficient_role: 'この操作を行う権限がありません',
    group_not_found: 'グループが見つからないか、あなたがメンバーではありません',
    member_not_found: 'メンバーが見つかりません',
    owner_must_use_transfer: '作成者は「譲渡」でのみ変更できます',
    owner_cannot_be_removed: '作成者は削除できません。グループが無主になります',
    self_action_not_allowed: '自分自身に対してこの操作はできません',
    invalid_group_name: 'グループ名が不正です（空でなく 64 文字以内）',
    group_limit_reached:
      '所有できるグループの上限（100 個）に達しました。不要なグループは他の人に譲渡してください',
    concurrent_modification: 'この記録は直前に他の人に変更されました。再読み込みしてください',
    already_member: 'あなたはすでにこのグループのメンバーです',
    invite_not_found: 'その招待コードは見つかりません。入力を確認してください',
    invite_expired:
      '招待コードの有効期限が切れています（作成から 72 時間有効）。招待した人に再発行を依頼してください',
    invite_used:
      'この招待コードはすでに使用済みです（1 回だけ有効）。招待した人に再発行を依頼してください',
    invite_revoked: 'この招待コードは無効化されました。招待した人に再発行を依頼してください',
    invite_not_for_caller: 'この招待コードはあなた宛てではありません',
    enrollment_disabled: 'このサーバーでは接続コードを発行していません（ローカルモードのみ対応）',
    enrollment_code_invalid: '接続コードが正しくありません。確認して入力し直してください',
    enrollment_code_expired: '接続コードの有効期限が切れました（発行から 15 分間有効）。再発行してください',
    enrollment_code_used: 'この接続コードは使用済みです（1 台のみ）。再発行してください',
    enrollment_code_revoked: 'この接続コードは無効化されています。再発行してください',
    node_mismatch: 'この接続コードは別の端末に紐づいています。別のコードか別の端末を使ってください',
    node_token_revoked: 'この端末のトークンは無効化されました。再接続が必要です',
    too_many_attempts: '試行回数が多すぎます。しばらくしてからお試しください',
    invite_already_member: 'あなたはすでにこのグループのメンバーです。重複して参加する必要はありません',
    transfer_not_found: 'その譲渡リクエストは見つかりません',
    transfer_pending: 'このグループには確認待ちの譲渡リクエストがあります。先に処理してください',
    transfer_not_recipient: '譲渡を承認・拒否できるのは受讓者本人だけです',
    transfer_expired: '譲渡リクエストは期限切れになりました。作成者は変わっていません',
    transfer_resolved: 'この譲渡リクエストはすでに処理済みです',
    



    not_revocable:
      'このコマンドはすでに端末へ配信済みのため、取り消せません（端末が実行済みの可能性があります）',
    command_expired:
      'このコマンドは期限切れのため、取り消す必要がありません。期限切れのコマンドは破棄され、後から実行されることはありません',
    not_found: '要求された内容が見つかりません',
    forbidden: 'この操作を行う権限がありません',
    unauthorized: 'セッションが期限切れです。もう一度ログインしてください',
    service_unavailable: 'サービスが一時的に利用できません。しばらくしてから再試行してください',
    network_error: 'サーバーに接続できません。ネットワークを確認して再試行してください',
    unknown: '操作に失敗しました。しばらくしてから再試行してください',
  },
  notFound: {
    title: 'ページが存在しません',
    desc: 'リンクが失効しているか、アドレスが正しくない可能性があります',
  },
}

export default messages
