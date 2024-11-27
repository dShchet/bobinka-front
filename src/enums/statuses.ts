export enum ArticleStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
}

export enum ColorStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
}

export enum OrderStatus {
    NEW = "new",
    WAITING_FOR_APPROVAL = "waiting_for_approval",
    USER_APPROVED = "user_approved",
    USER_REJECTED = "user_rejected",
    ADMIN_APPROVED = "admin_approved",
    ADMIN_REJECTED = "admin_rejected",
    PROCESSED = "processed",
    COMPLETE = "complete",
}
