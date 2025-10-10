/**
 * Product image management service for Supabase storage
 */
import supabase from "../SupabaseClient";

class ProductImageService {
  static BUCKET_NAME = "Products";

  /**
   * Extract filename from Supabase storage URL
   * @param {string} url - Supabase storage URL
   * @returns {string|null} - Filename or null if invalid
   */
  static extractFileNameFromUrl(url) {
    if (!url || typeof url !== "string") {
      return null;
    }

    try {
      // Handle different URL formats
      // Format 1: https://project.supabase.co/storage/v1/object/public/bucket/filename
      // Format 2: https://project.supabase.co/storage/v1/object/sign/bucket/filename

      // Split URL by '/'
      const urlParts = url.split("/");

      // Find the bucket name in the URL
      const bucketIndex = urlParts.findIndex(
        (part) => part === this.BUCKET_NAME
      );

      if (bucketIndex === -1) {
        console.warn("❌ Bucket name not found in URL");
        return null;
      }

      // Extract everything after the bucket name
      const pathParts = urlParts.slice(bucketIndex + 1);
      const fileName = pathParts.join("/");

      // Validate filename (should not be empty)
      if (fileName && fileName.trim() !== "") {
        return fileName;
      }

      console.warn("❌ Invalid filename extracted from URL");
      return null;
    } catch (error) {
      console.error("❌ Error extracting filename from URL:", error);
      return null;
    }
  }

  /**
   * Check if URL is a valid Supabase storage URL
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid Supabase storage URL
   */
  static isValidSupabaseUrl(url) {
    if (!url || typeof url !== "string") {
      return false;
    }

    // Check if it's a local/relative URL (starts with /)
    if (url.startsWith("/")) {
      return false;
    }

    // Check if it's a Supabase storage URL
    return url.includes("supabase.co/storage/v1/object/");
  }

  /**
   * Delete a single product image from storage
   * @param {string} imageUrl - The image URL to delete
   * @returns {Object} - Deletion result
   */
  static async deleteProductImage(imageUrl) {
    const result = {
      success: false,
      fileName: null,
      error: null,
    };

    try {
      // Skip non-Supabase URLs (like local placeholders)
      if (!this.isValidSupabaseUrl(imageUrl)) {
        result.error = "Skipped non-Supabase URL";
        console.log(`ℹ️ Skipping non-Supabase URL: ${imageUrl}`);
        return result;
      }

      const fileName = this.extractFileNameFromUrl(imageUrl);

      if (!fileName) {
        result.error = "Invalid image URL";
        return result;
      }

      result.fileName = fileName;

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        result.error = error.message;
        console.error(`❌ Error deleting image ${fileName}:`, error);
      } else {
        result.success = true;
        console.log(`✅ Successfully deleted image: ${fileName}`);
      }
    } catch (error) {
      result.error = error.message;
      console.error("❌ Error in deleteProductImage:", error);
    }

    return result;
  }

  /**
   * Delete all images for a product (organized folder structure)
   * @param {Object} product - Product object with images array
   * @returns {Object} - Deletion results summary
   */
  static async deleteProductImages(product) {
    const results = {
      success: true,
      deletedImages: [],
      errors: [],
      skippedUrls: [],
      totalDeleted: 0,
      totalSkipped: 0,
    };

    try {
      if (!product || !product.images || !Array.isArray(product.images)) {
        console.log("ℹ️ No images to delete for this product");
        return results;
      }

      console.log(
        `🗑️ Starting deletion of ${product.images.length} images for product: ${product.name}`
      );

      // Try to delete the entire product folder first (more efficient)
      const folderPath = this.getProductFolderPath(product.name);
      const folderDeletionResult = await this.deleteProductFolder(folderPath);

      if (folderDeletionResult.success) {
        results.totalDeleted = folderDeletionResult.deletedFiles.length;
        results.deletedImages = folderDeletionResult.deletedFiles.map(
          (filePath) => ({
            fileName: filePath.split("/").pop(),
            url: `folder:${folderPath}`,
          })
        );
        console.log(
          `✅ Successfully deleted entire product folder: ${folderPath}`
        );
        return results;
      }

      // Fallback: Delete individual images if folder deletion fails
      console.log(
        `⚠️ Folder deletion failed, falling back to individual image deletion`
      );

      for (const imageUrl of product.images) {
        // Skip non-Supabase URLs
        if (!this.isValidSupabaseUrl(imageUrl)) {
          results.skippedUrls.push({
            url: imageUrl,
            reason: "Non-Supabase URL (local placeholder)",
          });
          results.totalSkipped++;
          console.log(`ℹ️ Skipping non-Supabase URL: ${imageUrl}`);
          continue;
        }

        const deleteResult = await this.deleteProductImage(imageUrl);

        if (deleteResult.success) {
          results.deletedImages.push({
            fileName: deleteResult.fileName,
            url: imageUrl,
          });
          results.totalDeleted++;
        } else {
          results.errors.push({
            fileName: deleteResult.fileName,
            url: imageUrl,
            error: deleteResult.error,
          });
        }
      }

      results.success = results.errors.length === 0;

      console.log(
        `✅ Product image deletion completed: ${results.totalDeleted} deleted, ${results.totalSkipped} skipped, ${results.errors.length} errors`
      );

      return results;
    } catch (error) {
      console.error("❌ Error in deleteProductImages:", error);
      results.success = false;
      results.errors.push({
        type: "general",
        message: error.message,
        error: error,
      });
      return results;
    }
  }

  /**
   * Delete entire product folder
   * @param {string} folderPath - Path of the product folder
   * @returns {Object} - Deletion result
   */
  static async deleteProductFolder(folderPath) {
    const result = {
      success: false,
      deletedFiles: [],
      error: null,
    };

    try {
      // List all files in the folder
      const { data: files, error: listError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(folderPath);

      if (listError) {
        result.error = listError.message;
        console.warn(
          `⚠️ Could not list files in folder ${folderPath}:`,
          listError
        );
        return result;
      }

      if (!files || files.length === 0) {
        result.success = true;
        console.log(`ℹ️ Folder ${folderPath} is empty or doesn't exist`);
        return result;
      }

      // Delete all files in the folder
      const filePaths = files.map((file) => `${folderPath}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths);

      if (deleteError) {
        result.error = deleteError.message;
        console.error(`❌ Error deleting folder ${folderPath}:`, deleteError);
        return result;
      }

      result.success = true;
      result.deletedFiles = filePaths;

      console.log(
        `✅ Successfully deleted product folder: ${folderPath} (${filePaths.length} files)`
      );
      return result;
    } catch (error) {
      result.error = error.message;
      console.error(`❌ Error deleting product folder ${folderPath}:`, error);
      return result;
    }
  }

  /**
   * Get product folder path
   * @param {string} productName - Product name
   * @returns {string} - Sanitized folder path
   */
  static getProductFolderPath(productName) {
    if (!productName || typeof productName !== "string") {
      return "unknown";
    }

    return productName
      .replace(/[^a-zA-Z0-9\s\-_]/g, "") // Remove special characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .toLowerCase()
      .substring(0, 50); // Limit length
  }

  /**
   * Get summary of images for a product
   * @param {Object} product - Product object
   * @returns {Object} - Image summary
   */
  static getImageSummary(product) {
    if (!product || !product.images || !Array.isArray(product.images)) {
      return {
        hasImages: false,
        count: 0,
        images: [],
      };
    }

    return {
      hasImages: product.images.length > 0,
      count: product.images.length,
      images: product.images.map((url, index) => ({
        index,
        url,
        fileName: this.extractFileNameFromUrl(url),
      })),
    };
  }
}

export default ProductImageService;
