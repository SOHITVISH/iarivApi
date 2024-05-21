import { DateTime } from "luxon";
import mongoose from "mongoose";
import { TourLog } from "../../../types/type";


 

const tourlogSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true,
     },
     tour_id:{
        type: mongoose.Schema.Types.ObjectId, 
     
     },
    description: { 
        type: String, 
        required: [true] 
    },
    location_coords:{ type: {type:String},coordinates: [Number]},

    location_name: { 
        type: String,
    },
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'category', 
        required: true 
    },
    thumb:{
        type:String,
        default:"",
    },
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    },
    status: { 
        type: Number,
        default:2 
    },
    isTourBlock:{
        type:Boolean,
    },
    tour_explore_status_type_id:{
        type: Number,
        default:0
    },
    created_at: { type: String, default: DateTime.now().toUTC().toISO() },
    log_created_at: { type: String, default: DateTime.now().toUTC().toISO() },
    updated_at: { type: String, default: DateTime.now().toUTC().toISO() },
    
});

tourlogSchema.index({location: '2dsphere'});

tourlogSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const tourLogModel = mongoose.model<TourLog>("tour_log", tourlogSchema);
export default tourLogModel
