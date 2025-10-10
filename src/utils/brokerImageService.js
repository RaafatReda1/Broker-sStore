import supabase from "../SupabaseClient";

/**
 * Utility service for managing broker image deletions
 */
class BrokerImageService {
  /**
   * Delete all images associated with a broker
   * @param {Object} broker - The broker object containing image URLs
   * @returns {Promise<Object>} - Result object with success status and details
   */
  static async deleteBrokerImages(broker) {
    const results = {
      success: true,
      deletedImages: [],
      errors: [],
      totalDeleted: 0,
    };

    try {
      // Delete ID card images from BrokersCards bucket
      const idCardResults = await this.deleteIdCardImages(broker);
      results.deletedImages.push(...idCardResults.deletedImages);
      results.errors.push(...idCardResults.errors);

      // Delete avatar image from BrokersProfilePic bucket
      const avatarResults = await this.deleteAvatarImage(broker);
      results.deletedImages.push(...avatarResults.deletedImages);
      results.errors.push(...avatarResults.errors);

      results.totalDeleted = results.deletedImages.length;
      results.success = results.errors.length === 0;

      console.log(
        `✅ Image deletion completed: ${results.totalDeleted} deleted, ${results.errors.length} errors`
      );

      return results;
    } catch (error) {
      console.error("❌ Error in deleteBrokerImages:", error);
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
   * Delete ID card images from BrokersCards bucket
   * @param {Object} broker - The broker object
   * @returns {Promise<Object>} - Result object
   */
  static async deleteIdCardImages(broker) {
    const result = {
      deletedImages: [],
      errors: [],
    };

    const idCardFields = ["idCardFront", "idCardBack", "selfieWithIdCard"];

    for (const field of idCardFields) {
      if (broker[field]) {
        try {
          const fileName = this.extractFileNameFromUrl(broker[field]);

          if (fileName) {
            const { error } = await supabase.storage
              .from("BrokersCards")
              .remove([fileName]);

            if (error) {
              console.error(`❌ Error deleting ${field}:`, error);
              result.errors.push({
                type: field,
                fileName: fileName,
                message: error.message,
                error: error,
              });
            } else {
              console.log(`✅ Deleted ${field}:`, fileName);
              result.deletedImages.push({
                type: field,
                fileName: fileName,
                bucket: "BrokersCards",
              });
            }
          } else {
            console.warn(
              `⚠️ Could not extract filename from ${field} URL:`,
              broker[field]
            );
            result.errors.push({
              type: field,
              fileName: null,
              message: "Could not extract filename from URL",
              error: new Error("Invalid URL format"),
            });
          }
        } catch (error) {
          console.error(`❌ Exception deleting ${field}:`, error);
          result.errors.push({
            type: field,
            message: error.message,
            error: error,
          });
        }
      }
    }

    return result;
  }

  /**
   * Delete avatar image from BrokersProfilePic bucket
   * @param {Object} broker - The broker object
   * @returns {Promise<Object>} - Result object
   */
  static async deleteAvatarImage(broker) {
    const result = {
      deletedImages: [],
      errors: [],
    };

    if (broker.avatar_url) {
      try {
        const fileName = this.extractFileNameFromUrl(broker.avatar_url);

        if (fileName) {
          const { error } = await supabase.storage
            .from("BrokersProfilePic")
            .remove([fileName]);

          if (error) {
            console.error("❌ Error deleting avatar:", error);
            result.errors.push({
              type: "avatar",
              fileName: fileName,
              message: error.message,
              error: error,
            });
          } else {
            console.log("✅ Deleted avatar:", fileName);
            result.deletedImages.push({
              type: "avatar",
              fileName: fileName,
              bucket: "BrokersProfilePic",
            });
          }
        } else {
          console.warn(
            "⚠️ Could not extract filename from avatar URL:",
            broker.avatar_url
          );
          result.errors.push({
            type: "avatar",
            fileName: null,
            message: "Could not extract filename from URL",
            error: new Error("Invalid URL format"),
          });
        }
      } catch (error) {
        console.error("❌ Exception deleting avatar:", error);
        result.errors.push({
          type: "avatar",
          message: error.message,
          error: error,
        });
      }
    }

    return result;
  }

  /**
   * Extract filename from Supabase storage URL
   * @param {string} url - The storage URL
   * @returns {string|null} - The filename or null if invalid
   */
  static extractFileNameFromUrl(url) {
    if (!url || typeof url !== "string") {
      return null;
    }

    try {
      // Handle different URL formats
      // Format 1: https://project.supabase.co/storage/v1/object/public/bucket/filename
      // Format 2: https://project.supabase.co/storage/v1/object/sign/bucket/filename
      // Format 3: https://project.supabase.co/storage/v1/object/public/bucket/folder/filename

      // Split URL by '/'
      const urlParts = url.split("/");

      // Find the bucket name in the URL
      const bucketIndex = urlParts.findIndex(
        (part) => part === "BrokersCards" || part === "BrokersProfilePic"
      );

      if (bucketIndex === -1) {
        console.warn("❌ Bucket name not found in URL");
        return null;
      }

      // Extract everything after the bucket name
      const pathParts = urlParts.slice(bucketIndex + 1);
      const fullPath = pathParts.join("/");

      // Validate path (should not be empty)
      if (fullPath && fullPath.trim() !== "") {
        return fullPath;
      }

      console.warn("❌ Invalid path extracted from URL");
      return null;
    } catch (error) {
      console.error("❌ Error extracting filename from URL:", error);
      return null;
    }
  }

  /**
   * Delete all images in a broker's folder from BrokersCards bucket
   * This is a more aggressive approach that deletes all files in the broker's folder
   * @param {number} brokerId - The broker ID
   * @returns {Promise<Object>} - Result object
   */
  static async deleteBrokerFolder(brokerId) {
    const result = {
      deletedImages: [],
      errors: [],
    };

    try {
      console.log(`🗑️ Deleting all files in broker folder: ${brokerId}`);

      // List all files in the broker's folder
      const { data: files, error: listError } = await supabase.storage
        .from("BrokersCards")
        .list(`${brokerId}`, {
          limit: 100,
          offset: 0,
        });

      if (listError) {
        console.error("❌ Error listing files:", listError);
        result.errors.push({
          type: "list",
          message: listError.message,
          error: listError,
        });
        return result;
      }

      if (files && files.length > 0) {
        // Prepare file paths for deletion
        const filePaths = files.map((file) => `${brokerId}/${file.name}`);

        // Delete all files
        const { error: deleteError } = await supabase.storage
          .from("BrokersCards")
          .remove(filePaths);

        if (deleteError) {
          console.error("❌ Error deleting files:", deleteError);
          result.errors.push({
            type: "bulk_delete",
            message: deleteError.message,
            error: deleteError,
          });
        } else {
          console.log(`✅ Deleted ${files.length} files from broker folder`);
          result.deletedImages.push(
            ...files.map((file) => ({
              type: "folder_file",
              fileName: file.name,
              bucket: "BrokersCards",
              path: `${brokerId}/${file.name}`,
            }))
          );
        }
      } else {
        console.log("ℹ️ No files found in broker folder");
      }
    } catch (error) {
      console.error("❌ Exception in deleteBrokerFolder:", error);
      result.errors.push({
        type: "folder_delete",
        message: error.message,
        error: error,
      });
    }

    return result;
  }

  /**
   * Get image deletion summary for logging
   * @param {Object} broker - The broker object
   * @returns {Object} - Summary object
   */
  static getImageSummary(broker) {
    const summary = {
      hasIdCardFront: !!broker.idCardFront,
      hasIdCardBack: !!broker.idCardBack,
      hasSelfieWithIdCard: !!broker.selfieWithIdCard,
      hasAvatar: !!broker.avatar_url,
      totalImages: 0,
    };

    summary.totalImages = [
      summary.hasIdCardFront,
      summary.hasIdCardBack,
      summary.hasSelfieWithIdCard,
      summary.hasAvatar,
    ].filter(Boolean).length;

    return summary;
  }

  /**
   * Delete entire broker folder (organized structure)
   * @param {string} folderPath - Path of the broker folder
   * @returns {Object} - Deletion result
   */
  static async deleteBrokerFolderOrganized(folderPath) {
    const result = {
      success: false,
      deletedFiles: [],
      error: null,
    };

    try {
      // List all files in the folder
      const { data: files, error: listError } = await supabase.storage
        .from("BrokersCards")
        .list(folderPath);

      if (listError) {
        result.error = listError.message;
        console.warn(
          `⚠️ Could not list files in broker folder ${folderPath}:`,
          listError
        );
        return result;
      }

      if (!files || files.length === 0) {
        result.success = true;
        console.log(`ℹ️ Broker folder ${folderPath} is empty or doesn't exist`);
        return result;
      }

      // Delete all files in the folder
      const filePaths = files.map((file) => `${folderPath}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from("BrokersCards")
        .remove(filePaths);

      if (deleteError) {
        result.error = deleteError.message;
        console.error(
          `❌ Error deleting broker folder ${folderPath}:`,
          deleteError
        );
        return result;
      }

      result.success = true;
      result.deletedFiles = filePaths;

      console.log(
        `✅ Successfully deleted broker folder: ${folderPath} (${filePaths.length} files)`
      );
      return result;
    } catch (error) {
      result.error = error.message;
      console.error(`❌ Error deleting broker folder ${folderPath}:`, error);
      return result;
    }
  }

  /**
   * Get broker folder path (organized structure)
   * @param {Object} broker - Broker object
   * @returns {string} - Sanitized folder path
   */
  static getBrokerFolderPathOrganized(broker) {
    if (!broker || !broker.fullName) {
      return "unknown";
    }

    return broker.fullName
      .replace(/[^a-zA-Z0-9\s\-_]/g, "") // Remove special characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .toLowerCase()
      .substring(0, 50); // Limit length
  }
}

export default BrokerImageService;
