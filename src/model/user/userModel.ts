import { DateTime } from "luxon";
import mongoose from "mongoose";
import { User } from "../../types/type";



const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    email_verified: { type: Boolean, default: false },
    email_verified_at: { type: String },
    status: { type: Number, default: 1 },
    isSignIn: { type: Boolean, default: false },
    created_at: { type: String },
    updated_at: { type: String },
    updated_by: { type: mongoose.Schema.Types.ObjectId },
    location: { type: String },
    google_id_token: { type: String },
    google_sub: { type: String },
    timezone: { type: String },
    facebook_access_token: { type: String },
    signup_method: { type: Number, required: true },
    user_type_id: { type: Number, default: 51 }
});

userSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const userModel = mongoose.model<User>("user", userSchema);
export default userModel
