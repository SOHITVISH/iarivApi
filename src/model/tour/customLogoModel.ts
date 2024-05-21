import mongoose from 'mongoose'
import { DateTime } from 'luxon';
import { CustomLogo } from '../../types/type';

const customLogoSchema = new mongoose.Schema({
    tour_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref:"tour",
        required: [true] 
    },
    logo:{
        type:String,
        required: [true]
    },
    status:{
        type:Number,
        default: 16
    },
    created_at: { type: String },
    updated_at: { type: String },
})


customLogoSchema.pre("save", function setDatetime(next) {
  this.created_at = DateTime.now().toUTC().toISO()
  this.updated_at = DateTime.now().toUTC().toISO()
  next()
})

const customLogoModel = mongoose.model<CustomLogo>("custom_logo", customLogoSchema);
export default customLogoModel