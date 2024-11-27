export interface User {
    id: number,
    firstName: string,
    lastName?: string,
    username?: string,
    phone?: string,
    address?: string,
    wantsHotArticles?: boolean,
    pointsBalance: number,
}
