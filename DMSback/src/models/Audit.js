const mongoose = require("mongoose");

const AuditSchema = new mongoose.Schema(
  {
    // User who performed the action (denormalized to preserve history)
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    username: { type: String, required: true },

    // Company context (denormalized)
    companyId: { type: mongoose.Schema.Types.ObjectId },
    companyName: { type: String },

    // Action details
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE"],
      required: true,
    },
    resource: { type: String, required: true }, // "User", "Category", "Document", etc.
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    resourceName: { type: String }, // Name/title of the resource

    // Request details
    endpoint: { type: String }, // e.g., "/api/users/123"
    status: { type: Number }, // HTTP status code
    errorMessage: { type: String }, // Error message if action failed

    // For UPDATE actions - track what changed
    changes: {
      type: Map,
      of: new mongoose.Schema(
        {
          old: mongoose.Schema.Types.Mixed, // Previous value
          new: mongoose.Schema.Types.Mixed, // New value
        },
        { _id: false },
      ),
    },

    // Timestamps (auto-added)
  },
  { timestamps: true, collection: "audit" },
);

// Create indexes for fast queries
AuditSchema.index({ companyId: 1, createdAt: -1 });
AuditSchema.index({ userId: 1, createdAt: -1 });
AuditSchema.index({ action: 1 });
AuditSchema.index({ resource: 1, resourceId: 1 });

module.exports = mongoose.model("Audit", AuditSchema);
