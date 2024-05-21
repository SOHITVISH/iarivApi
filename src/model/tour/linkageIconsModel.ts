import { DateTime } from "luxon";
import mongoose from "mongoose";
import { LinkageIcons } from "../../types/type";



const linkageIconsSchema = new mongoose.Schema({
    name: {
        type: String
    },
    icon: {
        type: String,
    },
    status: {
        type: Number,
        default: 52,
    },
    user_id:{
        type:String,
        default:""
    },
    created_at: { type: String },
    updated_at: { type: String },

});

linkageIconsSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const linkageIconsModel = mongoose.model<LinkageIcons>("linkage_icons", linkageIconsSchema);
export default linkageIconsModel
