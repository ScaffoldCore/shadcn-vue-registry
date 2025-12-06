export interface IComponentsRegistry {
    [key: string]: {
        url: string
        header?: Record<string, string>
        params?: Record<string, string>
    } | string
}
