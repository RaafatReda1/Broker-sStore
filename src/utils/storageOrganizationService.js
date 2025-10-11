/**
 * Storage organization service for Supabase buckets
 * Provides organized folder structures for different types of images
 */
import supabase from "../SupabaseClient";

class StorageOrganizationService {
  // Bucket names
  static BUCKETS = {
    BROKER_CARDS: "BrokersCards",
    BROKER_PROFILE: "BrokersProfilePic",
    PRODUCTS: "Products",
  };

  /**
   * Sanitize folder/file names for safe storage
   * @param {string} name - Name to sanitize
   * @returns {string} - Sanitized name
   */
  static sanitizeName(name) {
    if (!name || typeof name !== "string") {
      return "unknown";
    }

    return name
      .replace(/[^a-zA-Z0-9\s\-_]/g, "") // Remove special characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .toLowerCase()
      .substring(0, 50); // Limit length
  }

  /**
   * Generate organized file path for broker ID cards
   * @param {string} brokerFullName - Broker's full name
   * @param {string} imageType - Type of image (front, back, selfie)
   * @param {string} fileExtension - File extension
   * @returns {string} - Organized file path
   */
  static getBrokerCardPath(brokerFullName, imageType, fileExtension) {
    const sanitizedName = this.sanitizeName(brokerFullName);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);

    return `${sanitizedName}/${imageType}_${timestamp}_${randomId}.${fileExtension}`;
  }

  /**
   * Generate organized file path for product images
   * @param {string} productName - Product name
   * @param {number} imageIndex - Index of the image (0, 1, 2, etc.)
   * @param {string} fileExtension - File extension
   * @returns {string} - Organized file path
   */
  static getProductImagePath(productName, imageIndex, fileExtension) {
    const sanitizedName = this.sanitizeName(productName);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);

    return `${sanitizedName}/image_${imageIndex}_${timestamp}_${randomId}.${fileExtension}`;
  }

  /**
   * Upload broker ID card images with organized folder structure
   * @param {Object} brokerData - Broker data with images
   * @param {string} brokerFullName - Broker's full name
   * @returns {Object} - Upload results with URLs
   */
  static async uploadBrokerCards(brokerData, brokerFullName) {
    const results = {
      success: true,
      urls: {},
      errors: [],
    };

    try {
      const uploadPromises = [];
      const imageTypes = [
        { key: "idCardFront", type: "front" },
        { key: "idCardBack", type: "back" },
        { key: "selfieWithIdCard", type: "selfie" },
      ];

      for (const { key, type } of imageTypes) {
        if (brokerData[key]) {
          const file = brokerData[key];
          const fileExt = file.name.split(".").pop().toLowerCase();
          const filePath = this.getBrokerCardPath(
            brokerFullName,
            type,
            fileExt
          );

          uploadPromises.push(
            this.uploadSingleFile(
              this.BUCKETS.BROKER_CARDS,
              filePath,
              file,
              key
            )
          );
        }
      }

      const uploadResults = await Promise.all(uploadPromises);

      // Process results
      uploadResults.forEach((result) => {
        if (result.success) {
          results.urls[result.key] = result.url;
        } else {
          results.errors.push(result.error);
          results.success = false;
        }
      });

      return results;
    } catch (error) {
      // Error uploading broker cards handled silently
      results.success = false;
      results.errors.push(error.message);
      return results;
    }
  }

  /**
   * Upload product images with organized folder structure
   * @param {Array} imageFiles - Array of image files
   * @param {string} productName - Product name
   * @returns {Object} - Upload results with URLs
   */
  static async uploadProductImages(imageFiles, productName) {
    const results = {
      success: true,
      urls: [],
      errors: [],
    };

    try {
      const uploadPromises = imageFiles.map((file, index) => {
        const fileExt = file.name.split(".").pop().toLowerCase();
        const filePath = this.getProductImagePath(productName, index, fileExt);

        return this.uploadSingleFile(
          this.BUCKETS.PRODUCTS,
          filePath,
          file,
          `image_${index}`
        );
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Process results
      uploadResults.forEach((result) => {
        if (result.success) {
          results.urls.push(result.url);
        } else {
          results.errors.push(result.error);
          results.success = false;
        }
      });

      return results;
    } catch (error) {
      // Error uploading product images handled silently
      results.success = false;
      results.errors.push(error.message);
      return results;
    }
  }

  /**
   * Upload a single file to Supabase storage
   * @param {string} bucketName - Name of the bucket
   * @param {string} filePath - Path where to store the file
   * @param {File} file - File to upload
   * @param {string} key - Key for identifying the upload
   * @returns {Object} - Upload result
   */
  static async uploadSingleFile(bucketName, filePath, file, key) {
    const result = {
      success: false,
      url: null,
      key: key,
      error: null,
    };

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        result.error = uploadError.message;
        // Error uploading handled silently
        return result;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      result.success = true;
      result.url = publicUrl;

      // Successfully uploaded handled silently
      return result;
    } catch (error) {
      result.error = error.message;
      // Error uploading handled silently
      return result;
    }
  }

  /**
   * Delete organized folder structure
   * @param {string} bucketName - Name of the bucket
   * @param {string} folderPath - Path of the folder to delete
   * @returns {Object} - Deletion result
   */
  static async deleteFolder(bucketName, folderPath) {
    const result = {
      success: false,
      deletedFiles: [],
      errors: [],
    };

    try {
      // List all files in the folder
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list(folderPath);

      if (listError) {
        result.errors.push(listError.message);
        return result;
      }

      if (!files || files.length === 0) {
        result.success = true;
        return result;
      }

      // Delete all files in the folder
      const filePaths = files.map((file) => `${folderPath}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(filePaths);

      if (deleteError) {
        result.errors.push(deleteError.message);
        return result;
      }

      result.success = true;
      result.deletedFiles = filePaths;

      // Successfully deleted folder handled silently
      return result;
    } catch (error) {
      result.errors.push(error.message);
      // Error deleting folder handled silently
      return result;
    }
  }

  /**
   * Get folder path for broker cards
   * @param {string} brokerFullName - Broker's full name
   * @returns {string} - Folder path
   */
  static getBrokerCardFolderPath(brokerFullName) {
    return this.sanitizeName(brokerFullName);
  }

  /**
   * Get folder path for product images
   * @param {string} productName - Product name
   * @returns {string} - Folder path
   */
  static getProductImageFolderPath(productName) {
    return this.sanitizeName(productName);
  }
}

export default StorageOrganizationService;
