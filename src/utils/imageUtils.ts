// src/utils/imageUtils.ts

/**
 * Converts a product name into a URL path for an image in the /public/prodImg/ folder.
 * Assumes all images are .png (adjust if needed).
 * Replaces spaces with nothing and converts to lowercase to create a reliable filename.
 * e.g., "Fancy Keyboard" -> "/prodImg/fancykeyboard.png"
 * @param productName The name of the product.
 * @returns The public URL path to the image.
 */
export const getProductImagePath = (productName: string): string => {
    if (!productName) {
        // Return a path to a default/placeholder image if name is missing
        return '/prodImg/default-placeholder.png'; // Make sure you have this default image
    }

    // 1. Remove spaces and special characters that are bad for filenames
    // 2. Convert to lowercase
    // 3. Add the folder path and file extension
    const filename = productName.replace(/\s+/g, '').toLowerCase();
    const extension = '.png'; // CHANGE THIS if you use .jpg, .webp, etc.

    return `/prodImg/${filename}${extension}`;
};