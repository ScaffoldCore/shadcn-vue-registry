export type registryItemTypeSchema
    = 'registry:lib'
        | 'registry:block'
        | 'registry:component'
        | 'registry:ui'
        | 'registry:hook'
        | 'registry:composable'
        | 'registry:page'
        | 'registry:file'
        | 'registry:theme'
        | 'registry:style'
        | 'registry:item'

    // Internal use only
        | 'registry:example'
        | 'registry:internal'

export interface IRegistryItemFileSchema {
    type: registryItemTypeSchema
    path: string
    content?: string
    target?: string
}

export interface IRegistryItemsSchema {
    $schema?: string
    name?: string
    type: registryItemTypeSchema
    title?: string
    description?: string
    files: IRegistryItemFileSchema[]
    dependencies?: string[]
    devDependencies?: string[]
    registryDependencies?: string[]
}

export interface IRegistrySchema {
    $schema: string
    name: string
    homepage: string
    title?: string
    author?: string
    description?: string
    items: IRegistryItemsSchema[]
}
