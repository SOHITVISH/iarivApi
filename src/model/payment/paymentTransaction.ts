import mongoose from 'mongoose'
import { DateTime } from 'luxon';
import { PaymentTransaction } from '../../types/type';

const paymentTransactionSchema = new mongoose.Schema({
    
    gateway_type:{
        type:Number
    },
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref:"user",
    },
    transaction_message:{
        type:String
    },
    amount:{
        type:Number
    },
    transaction_id:{
        type:String
    },
    transaction_status:{
        type:Number
    },
    created_at: { type: String },
    updated_at: { type: String },
})


paymentTransactionSchema.pre("save", function setDatetime(next) {
  this.created_at = DateTime.now().toUTC().toISO()
  this.updated_at = DateTime.now().toUTC().toISO()
  next()
})

const paymentTransactionModel = mongoose.model<PaymentTransaction>("payment_transaction", paymentTransactionSchema);
export default paymentTransactionModel