import mongoose from 'mongoose'
import { DateTime } from 'luxon';
import { CommunityAnswers } from '../../types/type';
import getisotime from '../../utils/time';

let date = getisotime(DateTime)

const answerSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true]
    },
    status: {
        type: Number,
    },
    question_id: {
        type: mongoose.Schema.Types.ObjectId,

    },
    answer: {
        type: String
    },
    reply: [{
        user_id: mongoose.Schema.Types.ObjectId,
        replied_answer: { type: String },
        isRepliedAnswer:{type:Boolean},
        created_at: { type: String, default: date },
        updated_at: { type: String, default: date }

    }],
    answer_by: {
        type: mongoose.Schema.Types.ObjectId,
    },
    created_at: { type: String },
    updated_at: { type: String },
})


answerSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})

const communityAnswerModel = mongoose.model<CommunityAnswers>("community_answer", answerSchema);
export default communityAnswerModel