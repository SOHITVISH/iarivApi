import mongoose from 'mongoose'
import { DateTime } from 'luxon';
import { Subscription } from '../../types/type';


const subscriptionHistorySchema = new mongoose.Schema({

    user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "user" },
    stripe_cus_id: { type: String },
    plan_id: { type: String },
    plan_name: { type: String },
    stripe_plan_id: { type: String },
    isSubscribed: { type: Boolean, required: true, default: false },
    isTrial: { type: Boolean },
    interval: { type: String },
    plan_type_id: {type: mongoose.Schema.Types.ObjectId, ref: "payment_plan" },
    interval_count: { type: Number },
    subscription_id: { type: String },
    subscription_method: { type: Number },
    cancel_request: { type: Boolean, default: false },
    cancel_at: { type: String, default:"" },
    subscription_start: { type: String },
    subscription_end: { type: String },
    trial_start: { type: String },
    trial_end: { type: String },
    next_billing_time: { type: String },
    created_at: { type: String },
    updated_at: { type: String },
})


subscriptionHistorySchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})

const subscriptionHistory = mongoose.model<Subscription>("subscription_history", subscriptionHistorySchema);
export default subscriptionHistory