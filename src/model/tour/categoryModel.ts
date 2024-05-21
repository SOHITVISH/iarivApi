import mongoose from 'mongoose'
import { TourCategory } from "../../types/type";
import { DateTime } from 'luxon';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  status:{
    type:Number,
    default:40
  },
  created_at: { type: String, default: DateTime.now().toUTC().toISO() },
  updated_at: { type: String, default: DateTime.now().toUTC().toISO() },
})


categorySchema.pre("save", function setDatetime(next) {
  this.created_at = DateTime.now().toUTC().toISO()
  this.updated_at = DateTime.now().toUTC().toISO()
  next()
})

const categoryModel = mongoose.model<TourCategory>("category", categorySchema);
export default categoryModel