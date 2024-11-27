export const urlSafeBase64Encode = (string: string) => {
    const encoded = btoa(string); // Base64 encoding
    return encoded // Making encoding URL-safe
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};
