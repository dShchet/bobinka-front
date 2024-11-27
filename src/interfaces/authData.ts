export interface AuthData {
    auth_date: number,
    first_name: string,
    hash: string
    id: number
    last_name?: string
    username?: string
    photo_url?: string
    is_eula_choice_remembered?: boolean
}

export interface UserAuthDataResponse {
    userExists: boolean
}
