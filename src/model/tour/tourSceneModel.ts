import mongoose from 'mongoose'
import { TourScene } from "../../types/type";
import { DateTime } from 'luxon';

const tourSceneSchema = new mongoose.Schema({
    title:{
        type:String,
    },
    min_zoom:{
        type:Number,
        default:1
    },
    max_zoom:{
        type:Number,
        default:10
    },
    priority:{
        type:Number,
        default:0
    },
    tour:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tour', 
        required: true 
    },
    originalscene: {
        type: String,
        required: true,
    },
    thumbscene: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        default:18
    },
    created_at: { type: String, default: DateTime.now().toUTC().toISO() },
    updated_at: { type: String, default: DateTime.now().toUTC().toISO() },
})


tourSceneSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const tourSceneModel = mongoose.model<TourScene>("tourscene", tourSceneSchema);
export default tourSceneModel