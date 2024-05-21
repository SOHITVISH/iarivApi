import mongoose from 'mongoose'
import { DateTime } from 'luxon';
import { CommunityQuestion } from '../../types/type';
import getisotime from '../../utils/time';


let date = getisotime(DateTime)


const questionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true]
    },
    status: {
        type: Number,
    },
    question: {
        type: String

    },
    viewed_by: [{
        user_id: mongoose.Schema.Types.ObjectId,
        viewed_at: { type: String },
        isQuestionViewed:{type:Boolean, default:false},
        created_at: { type: String, default: date },
        updated_at: { type: String, default: date }

    }],
    liked_by: [{
        user_id: mongoose.Schema.Types.ObjectId,
        isQuestionLiked: { type: Boolean, default: false },
        liked_at: { type: String, default: "" },
        unliked_at: { type: String, default: "" },
        created_at: { type: String, default: date },
        updated_at: { type: String, default: date }

    }],
    disliked_by: [{
        user_id: mongoose.Schema.Types.ObjectId,
        isQuestionDisliked: { type: Boolean, default: false },
        disliked_at: { type: String },
        undisliked_at: { type: String, default: "" },
        created_at: { type: String, default: date },
        updated_at: { type: String, default: date }
    }],
    created_at: { type: String },
    updated_at: { type: String },
})


questionSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})

const communityQuestionModel = mongoose.model<CommunityQuestion>("community_question", questionSchema);
export default communityQuestionModel