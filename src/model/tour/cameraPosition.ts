import mongoose from 'mongoose'
import { DateTime } from 'luxon';
import { CameraPosition } from '../../types/type';

const cameraPostionSchema = new mongoose.Schema({
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
    zoom_level: { 
        type: Number,
    },
    h_angle: { 
        type: String,
        required:true
    },
    v_angle: { 
        type: String,
        required:true
    },
    created_at: { type: String },
    updated_at: { type: String },
})


cameraPostionSchema.pre("save", function setDatetime(next) {
  this.created_at = DateTime.now().toUTC().toISO()
  this.updated_at = DateTime.now().toUTC().toISO()
  next()
})

const cameraPositionModel = mongoose.model<CameraPosition>("camera_position", cameraPostionSchema);
export default cameraPositionModel