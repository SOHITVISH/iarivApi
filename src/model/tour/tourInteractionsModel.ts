import { DateTime } from "luxon";
import mongoose from "mongoose";
import getisotime from "../../utils/time";
import { TourInteractions } from "../../types/type"
// import { type } from "os";

let date = getisotime(DateTime)

const tourInteractionSchema = new mongoose.Schema({
    tour_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tour',
        required: true
    },
    likes: [{
        user_id: mongoose.Schema.Types.ObjectId,
        isTourLiked: { type: Boolean, default: false },
        liked_at: { type: String, default: "" },
        unliked_at: { type: String, default: "" },
        created_at: { type: String, default: date },
        updated_at: { type: String, default: date }
    }],
    comments: [{
        user_id: mongoose.Schema.Types.ObjectId,
        comment: { type: String },
        comment_at: { type: String, default: date },
        created_at: { type: String, default: date },
        updated_at: { type: String, default: date }
    }],
    view_by: [{
        user_id: String,
        user_ip_address:{type:String},
        view_at: { type: String, default: date },
        created_at: { type: String, default: date },
        updated_at: { type: String, default: date }

    }],


    created_at: { type: String, default: DateTime.now().toUTC().toISO() },
    updated_at: { type: String, default: DateTime.now().toUTC().toISO() },

});



tourInteractionSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const tourInteractionModel = mongoose.model<TourInteractions>("tour_interactions", tourInteractionSchema);
export default tourInteractionModel
