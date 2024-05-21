import { DateTime } from "luxon";
import mongoose from "mongoose";
import { InfospotIcons } from "../../types/type";



const InfospotIconsSchema = new mongoose.Schema({
    name: {
        type: String
    },
    icon: {
        type: String,
    },
    status: {
        type: Number,
        default: 54,
    },
    user_id:{
        type:String,
        default:""
    },
    created_at: { type: String },
    updated_at: { type: String },

});

InfospotIconsSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const infospotIconsModel = mongoose.model<InfospotIcons>("infospot_icons", InfospotIconsSchema);
export default infospotIconsModel
