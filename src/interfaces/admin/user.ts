export interface Role {
    id: number
    name: string
    status: string
}

export interface AdminReferral {
    id: number
    referrerId: number
    referredId: number
}

export interface AdminUserInOrder {
    createdAt: Date

    id: number
    username?: string
    firstName: string
    lastName?: string
    phone?: string
    address?: string

    isEulaChoiceRemembered: boolean
    isDistributeAvailable: boolean
    wantsHotArticles: boolean
    pointsBalance: number

    role: Role
    referrals: AdminReferral[]
}
