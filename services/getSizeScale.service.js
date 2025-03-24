/**
 * Gets the size scale based on the provided size.
 *
 * @param {string} size - The size (e.g., "XS", "S", "M", "L", "XL").
 * @returns {number} - The size scale factor.
 */
export function getSizeScale(size) {
    switch (size.toUpperCase()) {
        case "XS": return 0.8;
        case "S": return 0.9;
        case "M": return 1.0;
        case "L": return 1.1;
        case "XL": return 1.2;
        default: return 1.0; // Default to M
    }
}