export interface PaginatedApiData<T> {
    total: number;
    page: number;
    size: number;
    results: T[];
}
