const Audit = require("../models/Audit");

/**
 * Log an audit entry
 * @param {Object} auditData - Audit data object
 * @param {String} auditData.userId - User ID performing action
 * @param {String} auditData.username - Username performing action
 * @param {String} auditData.companyId - Company ID context
 * @param {String} auditData.companyName - Company name
 * @param {String} auditData.action - "CREATE", "UPDATE", or "DELETE"
 * @param {String} auditData.resource - Resource type (e.g., "User", "Category")
 * @param {String} auditData.resourceId - ID of the resource being modified
 * @param {String} auditData.resourceName - Name/description of the resource
 * @param {String} auditData.endpoint - API endpoint called
 * @param {Number} auditData.status - HTTP status code
 * @param {String} auditData.errorMessage - Error message if failed (optional)
 * @param {Object} auditData.changes - Changes map for UPDATE actions (optional)
 *                 Format: { fieldName: { old: value, new: value }, ... }
 */
const auditLog = async (auditData) => {
  try {
    const audit = new Audit(auditData);
    await audit.save();
    return audit;
  } catch (error) {
    console.error("Error creating audit log:", error);
    // Don't throw - audit logging shouldn't break the main operation
    return null;
  }
};

/**
 * Helper to calculate changes between old and new object
 * @param {Object} oldData - Original data
 * @param {Object} newData - Updated data
 * @returns {Object} Changes map { fieldName: { old: value, new: value } }
 */
const getChanges = (oldData, newData) => {
  const changes = {};

  // Convert to plain objects if they're mongoose documents
  const oldObj = oldData._doc || oldData || {};
  const newObj = newData._doc || newData || {};

  // Check all fields in newObj
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  allKeys.forEach((key) => {
    // Skip system fields
    if (key === "_id" || key === "createdAt" || key === "updatedAt" || key === "__v") {
      return;
    }

    const oldValue = oldObj[key];
    const newValue = newObj[key];

    // Only record if values differ
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = {
        old: oldValue,
        new: newValue,
      };
    }
  });

  return changes;
};

module.exports = { auditLog, getChanges };
