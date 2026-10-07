















import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'








export const DEFAULT_CLIENT_ROOTS = ['D:\\code\\SecRandom', 'D:\\code\\SecRandom-C']








export function isClientRoot(root) {
  return existsSync(join(root, 'SecRandom.Core', 'Services', 'ControlNode', 'ControlSettingsCatalog.cs'))
}


export function resolveClientRoot() {
  return DEFAULT_CLIENT_ROOTS.find((root) => isClientRoot(root)) ?? null
}


export function groupIdOfClientGroup(clientGroupId) {
  return clientGroupId.startsWith('settings.') ? clientGroupId.slice('settings.'.length) : clientGroupId
}







export function parseCategoryOrder(source) {
  const arrayMatch = /CategoryOrder\s*=\s*\[([\s\S]*?)\];/.exec(source)
  const body = arrayMatch === null ? source : arrayMatch[1]

  const ids = []
  const pattern = /\(\s*typeof\([^)]*\)\s*,\s*"([^"]+)"\s*\)/g
  let match
  while ((match = pattern.exec(body)) !== null) ids.push(match[1])
  return ids
}


export function parsePageInfo(source) {
  const match = /\[PageInfo\(\s*"([^"]+)"\s*,\s*([A-Za-z0-9_.]+)\s*(?:,\s*"([^"]+)")?/.exec(source)
  if (match === null) return null

  
  
  const className = /partial\s+class\s+(\w+)/.exec(source)?.[1] ?? null
  return { id: match[1], icon: match[2], groupId: match[3] ?? null, className }
}
















export function parseGroups(source) {
  const groups = []
  const pattern =
    /new PageGroupInfo\(\s*([A-Za-z0-9_.]+|"[^"]*")\s*,\s*"([^"]+)"\s*,\s*(FluentIcons\.[A-Za-z0-9_]+)/g
  let match
  while ((match = pattern.exec(source)) !== null) {
    groups.push({ id: match[2], icon: match[3], captionKey: captionKeyOf(match[1]) })
  }
  return groups
}











function captionKeyOf(reference) {
  const trimmed = reference.trim()
  const literal = /^"(.*)"$/.exec(trimmed)
  const name = literal === null ? trimmed : literal[1]
  const parts = name.split('.')
  return parts[parts.length - 1] ?? ''
}



















export function parseSidebar(source) {
  const groups = []
  
  const marker = /AddGroup\(|AddSettingsPage<([A-Za-z0-9_]+)\s*>/g
  let match
  while ((match = marker.exec(source)) !== null) {
    if (match[1] === undefined) {
      
      const tail = source.slice(match.index)
      const info =
        /new PageGroupInfo\(\s*([A-Za-z0-9_.]+|"[^"]*")\s*,\s*"([^"]+)"\s*,\s*(FluentIcons\.[A-Za-z0-9_]+)/.exec(
          tail,
        )
      groups.push({
        id: info === null ? null : info[2],
        icon: info === null ? null : info[3],
        pages: [],
      })
      continue
    }

    if (groups.length === 0) groups.push({ id: null, icon: null, pages: [] })
    groups[groups.length - 1].pages.push(match[1])
  }
  return groups
}

function collectCsFiles(root) {
  const found = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry.endsWith('.cs')) found.push(full)
    }
  }
  walk(root)
  return found
}


export function readClientCatalog(clientRoot = resolveClientRoot()) {
  if (clientRoot === null) return null
  const catalogFile = join(clientRoot, 'SecRandom.Core', 'Services', 'ControlNode', 'ControlSettingsCatalog.cs')
  const appFile = join(clientRoot, 'SecRandom', 'App.axaml.cs')
  const pagesRoot = join(clientRoot, 'SecRandom', 'Views', 'SettingsPages')
  const commonDir = join(clientRoot, 'SecRandom', 'Langs', 'Common')

  if (!existsSync(catalogFile) || !existsSync(appFile) || !existsSync(pagesRoot)) return null

  const categories = parseCategoryOrder(readFileSync(catalogFile, 'utf8'))
  const appSource = readFileSync(appFile, 'utf8')

  const pages = []
  for (const file of collectCsFiles(pagesRoot)) {
    const info = parsePageInfo(readFileSync(file, 'utf8'))
    if (info !== null) pages.push(info)
  }

  const groups = parseGroups(appSource)
  
  
  
  const common = readClientResx(commonDir)

  const groupCaptions = {}
  for (const group of groups) {
    const labels = {}
    for (const language of Object.keys(RESX_LANGUAGE_FILES)) {
      const text = common?.[language]?.[group.captionKey]
      if (text !== undefined) labels[language] = text
    }
    groupCaptions[groupIdOfClientGroup(group.id)] = { key: group.captionKey, labels }
  }

  return {
    categories,
    pages,
    groups,
    
    groupCaptions,
    
    sidebar: parseSidebar(appSource),
  }
}











export function diffCatalog(client, snapshot) {
  const problems = []

  const snapshotIds = new Set(snapshot.map((entry) => entry.id))
  const clientIds = new Set(client.categories)

  for (const id of client.categories) {
    if (!snapshotIds.has(id)) {
      problems.push(
        `快照缺少分类「${id}」：客户端已新增，请更新 src/utils/client-settings-catalog.ts（并核对分组与图标）`,
      )
    }
  }
  for (const entry of snapshot) {
    if (!clientIds.has(entry.id)) {
      problems.push(`快照里的分类「${entry.id}」在客户端已不存在：请删除或改名`)
    }
  }

  const pageIds = new Set(client.pages.map((page) => page.id))
  const groupIds = new Set(client.groups.map((group) => groupIdOfClientGroup(group.id)))

  for (const entry of snapshot) {
    if (entry.clientPageId !== '' && !pageIds.has(entry.clientPageId)) {
      problems.push(
        `分类「${entry.id}」指向的客户端设置页「${entry.clientPageId}」不存在：改页面 id 时请同步快照`,
      )
    }
    if (entry.groupId !== 'other' && !groupIds.has(entry.groupId)) {
      problems.push(`分类「${entry.id}」的分组「${entry.groupId}」在客户端里不存在`)
    }
  }

  











  return problems
}












export function diffGroupCaptions(client, groups, consoleLabels = null) {
  const problems = []
  const clientGroups = client.groupCaptions ?? {}
  const clientIds = new Set((client.groups ?? []).map((group) => groupIdOfClientGroup(group.id)))

  for (const group of groups) {
    
    if (group.clientCaptionKey === '') continue

    const entry = clientGroups[group.id]
    if (entry === undefined) {
      problems.push(
        `分组「${group.id}」在客户端侧边栏里找不到：客户端已经删掉或改名了，` +
          '请同步 src/utils/client-settings-catalog.ts 与 i18n 的 nodeDetail.client.groups.*',
      )
      continue
    }

    if (entry.key !== group.clientCaptionKey) {
      problems.push(
        `分组「${group.id}」记的标题资源键是「${group.clientCaptionKey}」，` +
          `客户端用的是「${entry.key}」：资源键改名了，请核对三语文案`,
      )
    }

    if (consoleLabels === null || consoleLabels === undefined) continue

    
    
    if (Object.keys(entry.labels).length === 0) {
      problems.push(
        `分组「${group.id}」的标题读不到：客户端 SecRandom/Langs/Common/ 下找不到 ` +
          `Resources{,.en-US,.ja-JP}.resx，三语文案无从核对`,
      )
      continue
    }

    for (const language of Object.keys(RESX_LANGUAGE_FILES)) {
      const expected = entry.labels[language]
      if (expected === undefined) {
        problems.push(
          `分组「${group.id}」的 ${language} 资源里没有「${entry.key}」：` +
            '客户端这一语缺这条标题，控制台这边要照实留空，不要拿中文顶上',
        )
        continue
      }

      const actual = consoleLabels[language]?.[group.id]
      if (actual !== expected) {
        problems.push(
          `分组「${group.id}」的 ${language} 文案与客户端不一致：` +
            `客户端是「${expected}」（${entry.key}），控制台 i18n 里是「${actual ?? '（没有这一条）'}」`,
        )
      }
    }
  }

  
  for (const id of clientIds) {
    if (groups.some((group) => group.id === id)) continue
    problems.push(
      `客户端多了一个分组「${id}」：快照的 CLIENT_SETTINGS_GROUPS 里没有它，` +
        '请补上（顺序按 App.axaml.cs 的 AddGroup 注册顺序），并同步 i18n 词表',
    )
  }

  return problems
}










export function clientSidebarOrder(client) {
  const pageIdByClass = new Map()
  for (const page of client.pages ?? []) {
    if (typeof page.className === 'string' && page.className.length > 0) {
      pageIdByClass.set(page.className, page.id)
    }
  }

  const groups = new Map()
  const order = []
  






  const itemIndex = new Map()
  for (const group of client.sidebar ?? []) {
    const pages = []
    for (const className of group.pages) {
      const id = pageIdByClass.get(className)
      if (id !== undefined) pages.push(id)
    }
    
    if (pages.length === 0) continue
    const id = group.id === null ? null : groupIdOfClientGroup(group.id)
    groups.set(id, pages)
    order.push(id)
    pages.forEach((pageId, index) => itemIndex.set(pageId, { group: id, index }))
  }
  return { order, groups, itemIndex }
}














export function diffCatalogOrder(client, snapshot) {
  const problems = []
  const sidebar = clientSidebarOrder(client)
  const clientOrder = sidebar.order.filter((id) => id !== null)
  const groupIndex = new Map(clientOrder.map((id, index) => [id, index]))
  const pageGroupOf = new Map(
    (client.pages ?? []).map((page) => [page.id, page.groupId ?? null]),
  )

  





  const positionOf = (category) => {
    const pageId = category.clientPageId
    if (typeof pageId !== 'string' || pageId.length === 0) return null

    const declared = pageGroupOf.get(pageId)
    const registered = sidebar.itemIndex.get(pageId)
    const group = declared === undefined || declared === null
      ? (registered === undefined ? null : registered.group)
      : groupIdOfClientGroup(declared)
    if (group === null || !groupIndex.has(group)) return null

    return {
      group,
      index: registered === undefined ? Number.MAX_SAFE_INTEGER : registered.index,
      groupIndex: groupIndex.get(group),
    }
  }

  const positions = new Map()
  for (const category of snapshot) {
    const position = positionOf(category)
    if (position === null) continue
    positions.set(category.id, position)

    if (category.groupId !== 'other' && category.groupId !== position.group) {
      problems.push(
        `分类「${category.id}」在快照里属于分组「${category.groupId}」，` +
          `客户端的设置页「${category.clientPageId}」却注册在「${position.group}」：分组写错会让导航把它画到另一组`,
      )
    }
  }

  



  const comparable = snapshot
    .filter((category) => category.groupId !== 'other')
    .filter((category) => positions.has(category.id))

  const snapshotSequence = comparable
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((category) => category.id)

  const clientSequence = comparable
    .slice()
    .sort((left, right) => {
      const a = positions.get(left.id)
      const b = positions.get(right.id)
      return a.groupIndex - b.groupIndex || a.index - b.index
    })
    .map((category) => category.id)

  if (snapshotSequence.join(',') !== clientSequence.join(',')) {
    problems.push(
      '快照的分类顺序与客户端侧边栏的注册顺序不一致：导航的分组或组内顺序会与客户端不同。\n' +
        `      客户端（App.axaml.cs 的注册顺序）：${clientSequence.join(' → ')}\n` +
        `      快照（按 order 排序）：${snapshotSequence.join(' → ')}`,
    )
  }

  return problems
}



















export function diffPageLayout(client, pages, clientPageIdOf = null) {
  const problems = []
  const sidebar = clientSidebarOrder(client)

  const clientPageIdFor = (page) => {
    if (clientPageIdOf === null || clientPageIdOf === undefined) return page.id
    return clientPageIdOf[page.id] ?? ''
  }

  const positionByPageId = new Map()
  const groupByPageId = new Map(
    (client.pages ?? []).map((page) => [page.id, page.groupId ?? null]),
  )
  for (const page of client.pages ?? []) {
    if (groupByPageId.get(page.id) !== null) continue
    for (const [group, ids] of sidebar.groups) {
      const index = ids.indexOf(page.id)
      if (index >= 0) positionByPageId.set(page.id, { group, index })
    }
  }

  const positionOf = (pageId) => {
    const declared = groupByPageId.get(pageId)
    if (declared !== undefined && declared !== null) {
      const group = groupIdOfClientGroup(declared)
      const ids = sidebar.groups.get(group)
      const index = ids === undefined ? -1 : ids.indexOf(pageId)
      if (index >= 0) return { group, index }
    }
    return positionByPageId.get(pageId) ?? null
  }

  const order = sidebar.order.filter((id) => id !== null)
  const known = []
  for (const page of pages) {
    const clientPageId = clientPageIdFor(page)
    const position = clientPageId === '' ? null : positionOf(clientPageId)
    if (position === null) {
      problems.push(
        `快照里的页「${page.id}」（客户端页 ${clientPageId === '' ? '（没有对应页）' : clientPageId}）` +
          '在客户端的设置页注册里找不到：页 id 改名或这一页被移除时，导航会凭一个过期的快照画出来',
      )
      continue
    }
    if (page.groupId !== position.group) {
      problems.push(
        `快照里的页「${page.id}」归在分组「${page.groupId}」，客户端却把它放在「${position.group}」：` +
          '分组写错会让它在导航里出现在另一组下面',
      )
    }
    known.push({ id: page.id, group: position.group, index: position.index })
  }

  const snapshotSequence = known.map((entry) => entry.id)
  const clientSequence = known
    .slice()
    .sort((left, right) => order.indexOf(left.group) - order.indexOf(right.group) || left.index - right.index)
    .map((entry) => entry.id)

  if (snapshotSequence.join(',') !== clientSequence.join(',')) {
    problems.push(
      '快照的页面顺序与客户端侧边栏的注册顺序不一致：导航的顺序会与客户端不同。\n' +
        `      客户端（App.axaml.cs 的注册顺序）：${clientSequence.join(' → ')}\n` +
        `      快照（数组顺序）：${snapshotSequence.join(' → ')}`,
    )
  }

  return problems
}
















export function parseCategoryTypes(source) {
  const arrayMatch = /CategoryOrder\s*=\s*\[([\s\S]*?)\];/.exec(source)
  const body = arrayMatch === null ? source : arrayMatch[1]

  const entries = []
  const pattern = /\(\s*typeof\((\w+)\)\s*,\s*"([^"]+)"\s*\)/g
  let match
  while ((match = pattern.exec(body)) !== null) entries.push({ type: match[1], id: match[2] })
  return entries
}


export function parsePathAliases(source) {
  const aliases = new Map()
  const block = /PathAliases\s*=\s*new\([^)]*\)\s*\{([\s\S]*?)\};/.exec(source)
  if (block === null) return aliases

  const pattern = /\[\s*"([^"]+)"\s*\]\s*=\s*"([^"]+)"/g
  let match
  while ((match = pattern.exec(block[1])) !== null) aliases.set(match[1], match[2])
  return aliases
}


export function parseReadOnlyRules(source) {
  const quoted = (block) => [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1])

  const segments = /ReadOnlyPathSegments\s*=\s*new\([^)]*\)\s*\{([\s\S]*?)\};/.exec(source)
  const paths = /ReadOnlyPaths\s*=\s*new\([^)]*\)\s*\{([\s\S]*?)\};/.exec(source)
  const prefixes = /ReadOnlyPathPrefixes\s*=\s*\[([\s\S]*?)\];/.exec(source)

  return {
    segments: segments === null ? [] : quoted(segments[1]),
    paths: paths === null ? [] : quoted(paths[1]),
    prefixes: prefixes === null ? [] : quoted(prefixes[1]),
  }
}


export function snakeCasePathSegment(name) {
  let out = ''
  for (let index = 0; index < name.length; index += 1) {
    const current = name[index]
    
    if (
      current >= 'A' &&
      current <= 'Z' &&
      index > 0 &&
      (!(name[index - 1] >= 'A' && name[index - 1] <= 'Z') ||
        (index + 1 < name.length && name[index + 1] >= 'a' && name[index + 1] <= 'z'))
    ) {
      out += '_'
    }
    out += current.toLowerCase()
  }
  return out
}


function indexModelClasses(modelsRoot) {
  const index = new Map()
  if (!existsSync(modelsRoot)) return index

  
  
  
  const pattern =
    /(?:^|\n)[ \t]*(?:public|internal)\s+(?:static\s+|sealed\s+|abstract\s+|partial\s+)*class\s+(\w+)([^{]*)\{/g
  for (const file of collectCsFiles(modelsRoot)) {
    const source = readFileSync(file, 'utf8')
    let match
    while ((match = pattern.exec(source)) !== null) {
      if (index.has(match[1])) continue
      const colon = match[2].indexOf(':')
      const baseText = (colon < 0 ? '' : match[2].slice(colon + 1)).replace(/\bwhere\b[\s\S]*$/, '')
      index.set(match[1], {
        body: blockAfter(source, pattern.lastIndex),
        bases: baseText
          .split(',')
          .map((base) => base.trim())
          .filter((base) => base.length > 0),
      })
    }
  }
  return index
}


function collectEnumNames(enumsRoot) {
  const names = new Set()
  if (!existsSync(enumsRoot)) return names

  for (const file of collectCsFiles(enumsRoot)) {
    for (const match of readFileSync(file, 'utf8').matchAll(/public\s+enum\s+(\w+)/g)) {
      names.add(match[1])
    }
  }
  return names
}


function classifyScalar(type, enumNames) {
  const trimmed = type.trim()
  if (trimmed === 'bool') return 'bool'
  if (trimmed === 'int') return 'int'
  if (trimmed === 'double') return 'double'
  if (trimmed === 'string') return 'string'
  if (enumNames.has(trimmed)) return 'enum'
  return null
}







function readableMembers(index, typeName) {
  const members = []
  const seen = new Set()

  let current = typeName
  while (current !== undefined && !seen.has(current)) {
    seen.add(current)
    const entry = index.get(current)
    if (entry === undefined) break

    const observable =
      /\[ObservableProperty\]\s*(?:\[[^\]]*\]\s*)*private\s+([A-Za-z_][\w.<>[\],? ]*?)\s+_(\w+)\s*(?:=[^;]*)?;/g
    let match
    while ((match = observable.exec(entry.body)) !== null) {
      const field = match[2]
      members.push({ name: field.charAt(0).toUpperCase() + field.slice(1), type: match[1] })
    }

    const explicit =
      /(?:^|\n)((?:[ \t]*\[[^\n]*\]\s*\n)*)[ \t]*public\s+([A-Za-z_][\w.<>[\],? ]*?)\s+([A-Z]\w*)\s*\n?[ \t]*\{/g
    while ((match = explicit.exec(entry.body)) !== null) {
      const attributes = match[1]
      const body = blockAfter(entry.body, explicit.lastIndex)
      if (/(?:private|protected|internal)\s+set\b/.test(body)) continue
      if (!/\bset\b/.test(body)) continue
      members.push({ name: match[3], type: match[2], jsonIgnore: /JsonIgnore/.test(attributes) })
    }

    current = entry.bases.find((base) => index.has(base))
  }

  return members.filter(
    (member) => !member.name.startsWith('Legacy') && member.jsonIgnore !== true,
  )
}


function blockAfter(source, from) {
  let depth = 1
  for (let index = from; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    else if (source[index] === '}') {
      depth -= 1
      if (depth === 0) return source.slice(from, index)
    }
  }
  return source.slice(from)
}


function derivesFrom(index, typeName, ancestor) {
  let current = typeName
  const seen = new Set()
  while (current !== undefined && !seen.has(current)) {
    if (current === ancestor) return true
    seen.add(current)
    const entry = index.get(current)
    current = entry === undefined ? undefined : entry.bases.find((base) => index.has(base))
  }
  return false
}


function isConfigObject(index, typeName) {
  const trimmed = typeName.trim()
  return !trimmed.includes('<') && !trimmed.includes('[') && index.has(trimmed)
}









export function readClientSettingsPaths(clientRoot = resolveClientRoot()) {
  if (clientRoot === null) return null
  const catalogFile = join(clientRoot, 'SecRandom.Core', 'Services', 'ControlNode', 'ControlSettingsCatalog.cs')
  const modelsRoot = join(clientRoot, 'SecRandom.Core', 'Models')
  const enumsRoot = join(clientRoot, 'SecRandom.Core', 'Enums')

  if (!existsSync(catalogFile) || !existsSync(modelsRoot)) return null

  const catalog = readFileSync(catalogFile, 'utf8')
  const categories = parseCategoryTypes(catalog)
  const aliases = parsePathAliases(catalog)
  const readOnly = parseReadOnlyRules(catalog)

  const index = indexModelClasses(modelsRoot)
  const enumNames = collectEnumNames(enumsRoot)

  const channelFields = ['Enabled', 'DisplayDuration']

  const described = {}
  for (const category of categories) {
    const paths = new Set()
    const prefix = `${category.id}.`

    const append = (holderType, holderName) => {
      const scope = holderName === null ? prefix : `${prefix}${snakeCasePathSegment(holderName)}.`
      for (const member of readableMembers(index, holderType)) {
        
        if (derivesFrom(index, member.type.trim(), 'NotificationChannelSettings')) {
          const channelScope = `${scope}${snakeCasePathSegment(member.name)}.`
          for (const field of readableMembers(index, member.type.trim())) {
            if (!channelFields.includes(field.name)) continue
            if (classifyScalar(field.type, enumNames) === null) continue
            paths.add(resolvePath(channelScope + snakeCasePathSegment(field.name), aliases))
          }
          continue
        }

        if (classifyScalar(member.type, enumNames) !== null) {
          paths.add(resolvePath(scope + snakeCasePathSegment(member.name), aliases))
          continue
        }

        
        if (!isConfigObject(index, member.type)) continue
        for (const nested of readableMembers(index, member.type.trim())) {
          if (classifyScalar(nested.type, enumNames) === null) continue
          paths.add(
            resolvePath(`${scope}${snakeCasePathSegment(member.name)}.${snakeCasePathSegment(nested.name)}`, aliases),
          )
        }
      }
    }

    append(category.type, null)
    described[category.id] = [...paths].sort()
  }

  const writable = [...new Set(Object.values(described).flat())]
    .filter((path) => isWritablePath(path, readOnly))
    .sort()

  return { categories: categories.map((category) => category.id), described, writable }
}







export function missingSourceFiles(clientRoot, files) {
  return files.filter((file) => !existsSync(join(clientRoot, file)))
}


function isWritablePath(path, readOnly) {
  for (const segment of path.split('.')) {
    if (readOnly.segments.includes(segment)) return false
  }
  if (readOnly.prefixes.some((prefix) => path.startsWith(prefix))) return false
  return !readOnly.paths.includes(path)
}

function resolvePath(path, aliases) {
  return aliases.get(path) ?? path
}











export function diffSettingsPagePaths(client, pages, pathsWithoutRow = []) {
  const problems = []

  const everything = new Set(Object.values(client.described).flat())
  const rows = []
  










  const collect = (pageId, list) => {
    for (const row of list) {
      if (row.kind !== 'container') rows.push({ pageId, path: row.path })
      if (Array.isArray(row.rows) && row.rows.length > 0) collect(pageId, row.rows)
    }
  }
  for (const page of pages) {
    for (const section of page.sections) collect(page.id, section.rows)
  }
  const rowPaths = new Set(rows.map((row) => row.path))
  const exceptions = new Set(pathsWithoutRow.map((entry) => entry.path))

  for (const row of rows) {
    if (!everything.has(row.path)) {
      problems.push(
        `快照里「${row.pageId}」的路径「${row.path}」在客户端的设置目录里不存在：` +
          '客户端已改名或删除，请核对 ControlSettingsCatalog.cs（不要照抄旧快照）',
      )
    }
  }

  const missing = []
  for (const page of pages) {
    const described = client.described[page.id]
    if (described === undefined) {
      problems.push(`客户端目录里已经没有类目「${page.id}」：快照的页面 id 与 CategoryOrder 对不上了`)
      continue
    }
    for (const path of described) {
      if (!rowPaths.has(path) && !exceptions.has(path)) missing.push(`${page.id}: ${path}`)
    }
  }
  if (missing.length > 0) {
    problems.push(
      `客户端这几类里描述的设置没有对应的行（快照漏了，或该补进 CLIENT_SETTINGS_PATHS_WITHOUT_ROW）：\n` +
        missing.map((entry) => `      - ${entry}`).join('\n'),
    )
  }

  for (const entry of pathsWithoutRow) {
    if (rowPaths.has(entry.path)) {
      problems.push(
        `CLIENT_SETTINGS_PATHS_WITHOUT_ROW 里的「${entry.path}」现在快照已经有这一行了：请删掉这条排除记录`,
      )
    } else if (!everything.has(entry.path)) {
      problems.push(
        `CLIENT_SETTINGS_PATHS_WITHOUT_ROW 里的「${entry.path}」客户端已经不描述了：请删掉这条排除记录`,
      )
    }
  }

  return problems
}













export const RESX_LANGUAGE_FILES = {
  'zh-CN': 'Resources.resx',
  'en-US': 'Resources.en-US.resx',
  'ja-JP': 'Resources.ja-JP.resx',
}


export function readClientResx(directory, languages = RESX_LANGUAGE_FILES) {
  const table = {}
  for (const [language, fileName] of Object.entries(languages)) {
    const file = join(directory, fileName)
    if (!existsSync(file)) return null

    const entries = {}
    const source = readFileSync(file, 'utf8')
    









    const pattern =
      /<data\s+name="([^"]+)"[^>]*>\s*<value>([\s\S]*?)<\/value>(?:\s*<comment>[\s\S]*?<\/comment>)?\s*<\/data>/g
    let match
    while ((match = pattern.exec(source)) !== null) entries[match[1]] = decodeXml(match[2])

    table[language] = entries
  }
  return table
}


function decodeXml(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}












export function readComboBoxOptions(axamlFile, anchor) {
  if (!existsSync(axamlFile)) return null
  const source = readFileSync(axamlFile, 'utf8')

  const anchorIndex = source.indexOf(`x:Name="${anchor}"`)
  if (anchorIndex < 0) return null

  const openIndex = source.indexOf('<ComboBox', anchorIndex)
  if (openIndex < 0) return null

  const openTagEnd = source.indexOf('>', openIndex)
  if (openTagEnd < 0) return null

  const openTag = source.slice(openIndex, openTagEnd)
  const selectedIndex = /SelectedIndex="\{Binding\s+(?:Settings\.)?(\w+)/.exec(openTag)
  const selectedValue = /SelectedValue="\{Binding\s+(?:Settings\.)?(\w+)/.exec(openTag)
  const itemsSource = /ItemsSource="\{Binding\s+(\w+)/.exec(openTag)

  const tagPattern = /<(\/?)([A-Za-z_][\w.:]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g
  tagPattern.lastIndex = openTagEnd + 1

  let depth = 1
  let closeIndex = -1
  let match
  while ((match = tagPattern.exec(source)) !== null) {
    const [, closing, name, attributes] = match
    const selfClosing = /\/\s*$/.test(attributes)

    if (name === 'ComboBox' || name.endsWith(':ComboBox')) {
      if (closing === '/') {
        depth -= 1
        if (depth === 0) {
          closeIndex = match.index
          break
        }
      } else if (!selfClosing) {
        depth += 1
      }
    }
  }
  if (closeIndex < 0) return null

  const body = source.slice(openTagEnd + 1, closeIndex)
  const keys = []
  for (const item of body.matchAll(/<ComboBoxItem\b[^>]*\/?>/g)) {
    
    const resource = /\{x:Static\s+[\w.]+:Resources\.(\w+)\}/.exec(item[0])
    keys.push(resource === null ? null : resource[1])
  }

  return {
    property: (selectedIndex?.[1] ?? selectedValue?.[1] ?? null),
    itemsSource: itemsSource?.[1] ?? null,
    resourceKeys: keys,
  }
}






export function parseSnapshotSource(source) {
  const arrayMatch = /CLIENT_SETTINGS_CATEGORIES[^=]*=\s*\[([\s\S]*?)\n\]/.exec(source)
  const body = arrayMatch === null ? source : arrayMatch[1]

  const entries = []
  
  
  
  const pattern =
    /(?:^|\n)\s*id:\s*'([^']+)'[\s\S]*?clientPageId:\s*'([^']*)'[\s\S]*?groupId:\s*'([^']+)'[\s\S]*?order:\s*(\d+)/g
  let match
  while ((match = pattern.exec(body)) !== null) {
    entries.push({ id: match[1], clientPageId: match[2], groupId: match[3], order: Number(match[4]) })
  }

  
  
  const declared = (body.match(/(?:^|\n)\s*id:\s*'/g) ?? []).length
  if (declared !== entries.length) {
    throw new Error(
      `快照文件解析不完整（源码里有 ${declared} 个 id: ，只解析出 ${entries.length} 个）：` +
        '正则与文件结构已经对不上，请改用 `node node_modules/vitest/vitest.mjs run src/utils/client-settings-catalog.spec.ts`',
    )
  }

  return entries
}

function main() {
  const argv = process.argv.slice(2)
  const requireClient = argv.includes('--require')
  const flagIndex = argv.indexOf('--client')
  const explicitRoot = flagIndex >= 0 ? argv[flagIndex + 1] : undefined
  
  
  const clientRoot = explicitRoot ?? resolveClientRoot()

  if (clientRoot === null) {
    const message = `找不到客户端仓库（候选：${DEFAULT_CLIENT_ROOTS.join('、')}）：跳过漂移检查`
    if (requireClient) {
      console.error(`${message}，但 --require 要求必须检查`)
      process.exitCode = 1
      return
    }
    console.log(message)
    return
  }

  const client = readClientCatalog(clientRoot)
  if (client === null) {
    const message = `给出了客户端目录但不含集控源码（${clientRoot}）：跳过漂移检查`
    if (requireClient) {
      console.error(`${message}，但 --require 要求必须检查`)
      process.exitCode = 1
      return
    }
    console.log(message)
    return
  }

  const snapshotFile = join(import.meta.dirname, '..', 'src', 'utils', 'client-settings-catalog.ts')
  let snapshot
  try {
    snapshot = parseSnapshotSource(readFileSync(snapshotFile, 'utf8'))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
    return
  }

  if (snapshot.length === 0) {
    console.error('没能从快照文件里解析出任何分类：正则与文件结构已经对不上了，请改用测试路径')
    process.exitCode = 1
    return
  }

  const problems = [...diffCatalog(client, snapshot), ...diffCatalogOrder(client, snapshot)]
  if (problems.length === 0) {
    const sidebar = clientSidebarOrder(client)
    const groups = sidebar.order.filter((id) => id !== null)
    console.log(
      `设置目录快照与客户端一致（${client.categories.length} 个分类；侧边栏 ${groups.length} 个分组：${groups.join(' → ')}）`,
    )
    
    
    console.log('（分组标题的三语文案由 client-settings-catalog.spec.ts 核对，命令行只查集合/分组/顺序）')
    return
  }

  console.error(`设置目录快照与客户端不一致（${problems.length} 处）：`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exitCode = 1
}

if (process.argv[1] !== undefined && process.argv[1].endsWith('client-catalog-drift.mjs')) {
  main()
}
