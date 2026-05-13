export function can(permission: string, permissions: string[]) {
    return permissions.includes(permission);
}