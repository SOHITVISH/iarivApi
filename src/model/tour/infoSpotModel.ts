import { DateTime } from "luxon";
import mongoose from "mongoose";
import { Infospot } from "../../types/type";

 

const infoSpotSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        trim: true,
    },
    description: { 
        type: String, 
    },
    tour_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref:"tour",
        required: [true] 
    },
    icon: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref:"infospot_icons",
    },
    scene_id: { 
        type: mongoose.Schema.Types.ObjectId,
        ref:"tourscenes",
        required: [true] 
    },
    type: { 
        type: Number,
        default:12
    },
    video_url: { 
        type: String,
    },
    url_title: { 
        type: String,
    },
    url: { 
        type: String,
    },
    image:{
        type: String,
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
    status: { 
        type: Number,
        default:10
    },
    created_at: { type: String },
    updated_at: { type: String },
    
});

infoSpotSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const infoSpotModel = mongoose.model<Infospot>("infospots", infoSpotSchema);
export default infoSpotModel
