/**
 * File validation utility for image uploads
 */
class FileValidationService {
  // Maximum file size in bytes (1MB)
  static MAX_FILE_SIZE = 1024 * 1024; // 1MB

  // Allowed image MIME types
  static ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  /**
   * Validate a single file
   * @param {File} file - The file to validate
   * @returns {Object} - Validation result with success, error, and file info
   */
  static validateFile(file) {
    const result = {
      success: true,
      error: null,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeFormatted: this.formatFileSize(file.size),
      },
    };

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      result.success = false;
      result.error = `File size (${this.formatFileSize(
        file.size
      )}) exceeds the maximum allowed size of 1MB`;
      return result;
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      result.success = false;
      result.error = `File type "${file.type}" is not supported. Please use JPEG, PNG, WebP, or GIF images`;
      return result;
    }

    return result;
  }

  /**
   * Validate multiple files
   * @param {FileList} files - The files to validate
   * @returns {Object} - Validation result with valid files and errors
   */
  static validateFiles(files) {
    const result = {
      validFiles: [],
      errors: [],
      totalSize: 0,
      validCount: 0,
      invalidCount: 0,
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = this.validateFile(file);

      if (validation.success) {
        result.validFiles.push(file);
        result.totalSize += file.size;
        result.validCount++;
      } else {
        result.errors.push({
          fileName: file.name,
          error: validation.error,
          fileInfo: validation.fileInfo,
        });
        result.invalidCount++;
      }
    }

    return result;
  }

  /**
   * Format file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get file size limit message
   * @returns {string} - User-friendly size limit message
   */
  static getSizeLimitMessage() {
    return `Maximum file size: ${this.formatFileSize(this.MAX_FILE_SIZE)}`;
  }

  /**
   * Get supported file types message
   * @returns {string} - User-friendly supported types message
   */
  static getSupportedTypesMessage() {
    return "Supported formats: JPEG, PNG, WebP, GIF";
  }

  /**
   * Show validation errors as toast notifications
   * @param {Array} errors - Array of error objects
   * @param {Function} toast - Toast notification function
   */
  static showValidationErrors(errors, toast) {
    if (errors.length === 0) return;

    // Show first error as main message
    const firstError = errors[0];
    toast.error(`${firstError.fileName}: ${firstError.error}`);

    // Show additional errors if there are more
    if (errors.length > 1) {
      setTimeout(() => {
        toast.warning(
          `${
            errors.length - 1
          } additional files were rejected. Check console for details.`
        );
        // Additional file validation errors handled silently
      }, 1000);
    }
  }

  /**
   * Show validation success message
   * @param {number} validCount - Number of valid files
   * @param {string} totalSize - Total size of valid files
   * @param {Function} toast - Toast notification function
   */
  static showValidationSuccess(validCount, totalSize, toast) {
    if (validCount > 0) {
      toast.success(
        `${validCount} file(s) selected (${this.formatFileSize(totalSize)})`
      );
    }
  }

  /**
   * Create file input validation handler
   * @param {Function} onValidFiles - Callback for valid files
   * @param {Function} onError - Callback for validation errors
   * @param {Function} toast - Toast notification function
   * @returns {Function} - Event handler function
   */
  static createValidationHandler(onValidFiles, onError, toast) {
    return (event) => {
      const files = event.target.files;

      if (!files || files.length === 0) {
        return;
      }

      const validation = this.validateFiles(files);

      if (validation.errors.length > 0) {
        this.showValidationErrors(validation.errors, toast);
        if (onError) onError(validation.errors);
      }

      if (validation.validFiles.length > 0) {
        this.showValidationSuccess(
          validation.validCount,
          validation.totalSize,
          toast
        );
        if (onValidFiles) onValidFiles(validation.validFiles);
      }

      // Clear the input if there were validation errors
      if (validation.errors.length > 0 && validation.validFiles.length === 0) {
        event.target.value = "";
      }
    };
  }
}

export default FileValidationService;
