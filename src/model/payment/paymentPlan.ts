import mongoose from 'mongoose'
import { DateTime } from 'luxon';
import { PaymentPlan } from '../../types/type';

const paymentPlanSchema = new mongoose.Schema({
    plan_name: {
        type: String,
    },
    plan_type: {
        type: Number
    },
    tour_limit: {
        type: Number,
    },
    tour_scenes_limit:{
        type: Number,
    },
    plan_price: {
        type: Number,
    },
    paypal_plan_id: {
        type: String,
    },
    stripe_price_id: {
        type: String,
    },
    interval: {
        type: String,
    },
    plan_status: {
        type: Number,
        default: 20
    },
    created_at: { type: String },
    updated_at: { type: String },
})


paymentPlanSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})

const paymentPlanModel = mongoose.model<PaymentPlan>("payment_plan", paymentPlanSchema);
export default paymentPlanModel