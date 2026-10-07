








export interface ClientPageShape {
  id: string
  icon: string
  groupId: string | null
}







export interface ClientGroupShape {
  id: string
  icon: string
  captionKey: string
}


export interface ClientGroupCaptionShape {
  key: string
  labels: { [language: string]: string }
}






export interface ClientSidebarGroupShape {
  id: string | null
  icon: string | null
  pages: string[]
}


export interface ClientSidebarOrderShape {
  order: (string | null)[]
  groups: Map<string | null, string[]>
  itemIndex: Map<string, { group: string | null; index: number }>
}

export interface ClientCatalogShape {
  categories: string[]
  pages: ClientPageShape[]
  groups: ClientGroupShape[]
  
  groupCaptions: { [groupId: string]: ClientGroupCaptionShape }
  
  sidebar: ClientSidebarGroupShape[]
}

export interface SnapshotEntryShape {
  id: string
  clientPageId: string
  groupId: string
  order: number
}


export interface SnapshotGroupShape {
  id: string
  clientCaptionKey: string
}


export declare const DEFAULT_CLIENT_ROOTS: readonly string[]

export declare function isClientRoot(root: string): boolean

export declare function resolveClientRoot(): string | null

export declare function groupIdOfClientGroup(clientGroupId: string): string
export declare function parseCategoryOrder(source: string): string[]
export declare function parsePageInfo(source: string): ClientPageShape | null
export declare function parseGroups(source: string): ClientGroupShape[]
export declare function parseSidebar(source: string): ClientSidebarGroupShape[]
export declare function readClientCatalog(clientRoot?: string): ClientCatalogShape | null
export declare function diffCatalog(
  client: ClientCatalogShape,
  snapshot: readonly SnapshotEntryShape[],
): string[]
export declare function clientSidebarOrder(client: ClientCatalogShape): ClientSidebarOrderShape
export declare function diffCatalogOrder(
  client: ClientCatalogShape,
  snapshot: readonly SnapshotEntryShape[],
): string[]




export declare function diffGroupCaptions(
  client: ClientCatalogShape,
  groups: readonly SnapshotGroupShape[],
  consoleLabels?: { [language: string]: { [groupId: string]: string } } | null,
): string[]






export declare function diffPageLayout(
  client: ClientCatalogShape,
  pages: readonly { id: string; groupId: string }[],
  clientPageIdOf?: { [pageId: string]: string } | null,
): string[]
export declare function parseSnapshotSource(source: string): SnapshotEntryShape[]







export interface ClientSettingsPathsShape {
  categories: string[]
  
  described: Record<string, string[]>
  
  writable: string[]
}











export interface ClientSettingsRowShape {
  kind?: 'row' | 'container'
  path?: string
  rows?: readonly ClientSettingsRowShape[]
}

export interface ClientSettingsPageShape {
  id: string
  sections: readonly { rows: readonly ClientSettingsRowShape[] }[]
}

export declare function parseCategoryTypes(source: string): { type: string; id: string }[]
export declare function parsePathAliases(source: string): Map<string, string>
export declare function parseReadOnlyRules(source: string): {
  segments: string[]
  paths: string[]
  prefixes: string[]
}
export declare function snakeCasePathSegment(name: string): string
export declare function readClientSettingsPaths(clientRoot?: string): ClientSettingsPathsShape | null
export declare function missingSourceFiles(clientRoot: string, files: readonly string[]): string[]
export declare function diffSettingsPagePaths(
  client: ClientSettingsPathsShape,
  pages: readonly ClientSettingsPageShape[],
  pathsWithoutRow?: readonly { path: string; reason: string }[],
): string[]








export interface ClientResxTableShape {
  [language: string]: { [key: string]: string }
}

export declare const RESX_LANGUAGE_FILES: { [language: string]: string }


export declare function readClientResx(
  directory: string,
  languages?: { [language: string]: string },
): ClientResxTableShape | null


export interface ComboBoxOptionsShape {
  
  property: string | null
  
  itemsSource: string | null
  resourceKeys: (string | null)[]
}





export declare function readComboBoxOptions(
  axamlFile: string,
  anchor: string,
): ComboBoxOptionsShape | null
