export interface FastPreorderMedia {
    id: number;
    fileId: string;
}

export interface FastPreorderDraft {
    id: number;
    media: FastPreorderMedia[];
    description: string | null;
    mediaGroupId: string | null;
    expiredAt?: Date
}
