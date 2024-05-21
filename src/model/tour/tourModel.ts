import { DateTime } from "luxon";
import mongoose from "mongoose";
import { Tour } from "../../types/type";

 

const tourSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true,
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
    updated_at: { type: String, default: DateTime.now().toUTC().toISO() },
    
});

tourSchema.index({location: '2dsphere'});

tourSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const tourModel = mongoose.model<Tour>("tour", tourSchema);
export default tourModel
