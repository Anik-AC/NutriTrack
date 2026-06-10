import mongoose from "mongoose";

const { Schema, Types: { ObjectId } } = mongoose;

const progressPhotoSchema = new Schema(
  {
    userId:       { type: ObjectId, ref: "users", required: true, index: true },
    imageUrl:     { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    publicId:     { type: String, required: true }, // Cloudinary public_id for deletion
    date:         { type: Date, default: Date.now },
    pose:         { type: String, enum: ["front", "side", "back", "custom"], default: "front" },
    notes:        { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

progressPhotoSchema.index({ userId: 1, date: -1 });

export default mongoose.model("progressPhoto", progressPhotoSchema);
