import { DateTime } from "luxon";
import mongoose from "mongoose";

const date = new Date();

const statusSchema = new mongoose.Schema({
  status_type_id: { 
    type: Number, 
    required: true 
  },
  status_type: { 
    type: String, 
    required: true 
  },
  created_at: { 
    type: String, 
    default: DateTime.now().toUTC().toISO() 
  },
  updated_at: { 
    type: String, 
    default: DateTime.now().toUTC().toISO() 
  }
});

statusSchema.pre("save", function setDatetime(next) {
  this.created_at = DateTime.now().toUTC().toISO()
  this.updated_at = DateTime.now().toUTC().toISO()
  next()
})

const statusType = mongoose.model("status_type", statusSchema);
export default statusType
