import { DateTime } from "luxon";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    facebook_access_token: { type: String },
    email_verified: { type: Boolean, default: false },
    email_verified_at: { type: String },
    status: { type: Number, default: 1 },
    isSignIn: { type: Boolean },
    google_id_token: { type: String },
    google_sub: { type: String },
    changed_fields: [String],
    signup_method: { type: Number, required: true },
    created_at: { type: String, default: DateTime.now().toUTC().toISO() },
    updated_at: { type: String, default: DateTime.now().toUTC().toISO() },
    log_created_at: { type: String, default: DateTime.now().toUTC().toISO() },
    updated_by: { type: String },
});

userSchema.pre("save", function setDatetime(next) {
    this.log_created_at = DateTime.now().toUTC().toISO()
    next()
})

const userModelLog = mongoose.model("user_log", userSchema);
export default userModelLog