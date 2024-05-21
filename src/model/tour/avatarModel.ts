import mongoose from 'mongoose'
import { DateTime } from 'luxon';
import { Avatar } from '../../types/type';

const avatarSchema = new mongoose.Schema({
    tour_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref:"tour",
        required: [true] 
    },
    scene_id: { 
        type: mongoose.Schema.Types.ObjectId,
        ref:"tourscenes",
        required: [true] 
    },
    avatar:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"avatar_characters"
    },
    avatar_speech_text:{
        type:String
    },
    avatar_speech_audio:{
        type:String
    },
    speech_type:{
        type:Number
    },
    x_axis: { 
        type: String,
        required:true
    },
    y_axis: { 
        type: String,
        required:true
    },
    status: { 
        type: Number,
        default:29
    },
    created_at: { type: String },
    updated_at: { type: String },
})


avatarSchema.pre("save", function setDatetime(next) {
  this.created_at = DateTime.now().toUTC().toISO()
  this.updated_at = DateTime.now().toUTC().toISO()
  next()
})

const avatarModel = mongoose.model<Avatar>("avatar", avatarSchema);
export default avatarModel