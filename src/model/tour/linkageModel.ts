import { DateTime } from "luxon";
import mongoose from "mongoose";
import { Linkage } from "../../types/type";

 

const linkageSchema = new mongoose.Schema({
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
    link_to: { 
        type: mongoose.Schema.Types.ObjectId,
        ref:"tourscenes",
        required: [true] 
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
    icon: { 
        type:  mongoose.Schema.Types.ObjectId,
        ref:"linkage_icons"
    },
    isCustom: { 
        type: Boolean,
        default: false,
    },
    status: { 
        type: Number,
        default: 8,
    },
    created_at: { type: String },
    updated_at: { type: String },
    
});

linkageSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const linkageModel = mongoose.model<Linkage>("linkages", linkageSchema);
export default linkageModel
