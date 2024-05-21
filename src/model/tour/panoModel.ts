import mongoose from 'mongoose'
import { DateTime } from 'luxon';
import { Pano } from '../../types/type';

const panoSchema = new mongoose.Schema({
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
    image:{
        type: String,
        required:true
    },
    x_axis: { 
        type: String,
        required:true
    },
    y_axis: { 
        type: String,
        required:true
    },
    z_axis: { 
        type: String,
        required:true
    },
    scale:{
        type:Number,
        default:1
    },
    status: { 
        type: Number,
        default:14
    },
    created_at: { type: String },
    updated_at: { type: String },
})


panoSchema.pre("save", function setDatetime(next) {
  this.created_at = DateTime.now().toUTC().toISO()
  this.updated_at = DateTime.now().toUTC().toISO()
  next()
})

const panoModel = mongoose.model<Pano>("panos", panoSchema);
export default panoModel