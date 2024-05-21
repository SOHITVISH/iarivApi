import { DateTime } from "luxon";
import mongoose from "mongoose";
import { AdminAvatar } from "../../types/type";



const adminAvatarSchema = new mongoose.Schema({
    name: {
        type: String
    },
    avatar: {
        type: String,
    },
    gender:{
        type:String,
    },
    status: {
        type: Number,
        default: 56,
    },
    user_id:{
        type:String,
        default:""
    },
    created_at: { type: String },
    updated_at: { type: String },

});

adminAvatarSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const adminAvatarModel = mongoose.model<AdminAvatar>("avatar_characters", adminAvatarSchema);
export default adminAvatarModel
