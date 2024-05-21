import { DateTime } from "luxon";
import mongoose from "mongoose";
import { TourExploreStatusType } from "../../types/type";

const date = new Date();

const tourExploreCategoryStatusSchema = new mongoose.Schema({
    tour_explore_status_type_id: { 
    type: Number, 
    required: true 
  },
  tour_explore_status_type_name: { 
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

tourExploreCategoryStatusSchema.pre("save", function setDatetime(next) {
  this.created_at = DateTime.now().toUTC().toISO()
  this.updated_at = DateTime.now().toUTC().toISO()
  next()
})

const tourExploreCategory = mongoose.model<TourExploreStatusType>("tour_explore_status_type", tourExploreCategoryStatusSchema);
export default tourExploreCategory
