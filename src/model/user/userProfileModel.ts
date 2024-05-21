
import { DateTime } from "luxon";
import mongoose from "mongoose";
import { UserProfile } from "../../types/type";



const profileSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'user',  },
    photo:{type:String, default:""},
  
    website:{type:String},
    facebook_link:{type:String},
    instagram_link:{type:String},
    twitter_link:{type:String},
    location:{type:String},
    about:{type:String},
    address:{type:String},
    city:{type:String},
    state:{type:String},
    country:{type:String},
    pincode:{type:String},
    status: { type: Number, default: 1 },
    created_at: { type: String },
    updated_at: { type: String },
});

profileSchema.pre("save", function setDatetime(next) {
    this.created_at = DateTime.now().toUTC().toISO()
    this.updated_at = DateTime.now().toUTC().toISO()
    next()
})


const userProfileModel = mongoose.model<UserProfile>("user_profile", profileSchema);
export default userProfileModel
