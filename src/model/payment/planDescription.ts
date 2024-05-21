import mongoose from 'mongoose'
import { DateTime } from 'luxon';
import { PaymentDescription } from '../../types/type';

const planDescriptionSchema = new mongoose.Schema({
    plan_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "payment_plan",
    },
    plan_desc: {
        type: String,
    },
    plan_status: {
        type: Number,
        default: 22
    },
    created_at: { type: String },
    updated_at: { type: String },
})


planDescriptionSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})

const planDescriptionModel = mongoose.model<PaymentDescription>("payment_plan_desc", planDescriptionSchema);
export default planDescriptionModel