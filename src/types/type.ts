import mongoose, { Document } from "mongoose";

interface DocumentResult<T> {
    _doc: T;
}

export interface User extends DocumentResult<User>, Document {
    name: string,
    email: string,
    password: string,
    signup_method:number,
    email_verified: boolean,
    email_verified_at: string,
    status: number,
    google_id_token:string ,
    google_sub:string,
    facebook_access_token:string,
    isSignIn: boolean,
    created_at: string,
    updated_at: string,
    updated_by: string,
}

export interface Tour extends DocumentResult<Tour>, Document {
    name: string,
    user_id: string,
    description: string,
    location_coords: {
        type: { type: string },
        coordinates: [number]
    },
    location_name: string,
    isTourBlock: boolean,
    scene: string,
    thumb: string,
    user_type_id: number,
    category: mongoose.Schema.Types.ObjectId,
    status: number,
    tour_explore_status_type_id: number
}

export interface TourLog extends DocumentResult<TourLog>, Document {
    name: string,
    user_id: string,
    description: string,
    tour_id:mongoose.Schema.Types.ObjectId,
    location_coords: {
        type: { type: string },
        coordinates: [number]
    },
    location_name: string,
    isTourBlock: boolean,
    scene: string,
    thumb: string,
    user_type_id: number,
    category: mongoose.Schema.Types.ObjectId,
    status: number,
    tour_explore_status_type_id: number
    created_at:string
    updated_at:string,
    log_created_at:string
}


export interface TourCategory extends DocumentResult<TourCategory>, Document {
    name: string,
    status: number
}

export interface TourScene extends DocumentResult<TourScene>, Document {
    title: string,
    min_zoom: number,
    max_zoom: number,
    priority: number,
    tour: mongoose.Schema.Types.ObjectId,
    originalscene: string,
    thumbscene: string,
    status: number,
}
export interface Linkage extends DocumentResult<Linkage>, Document {
    tour_id: mongoose.Schema.Types.ObjectId,
    scene_id: mongoose.Schema.Types.ObjectId,
    link_to: mongoose.Schema.Types.ObjectId,
    x_axis: string,
    y_axis: string,
    z_axis: string,
    icon: mongoose.Schema.Types.ObjectId,
    isCustom: boolean,
    status: number,
}

export interface LinkageIcons extends DocumentResult<LinkageIcons>, Document {
    user_id:string,
    name: string
    icon: string,
    status: number,
}

export interface InfospotIcons extends DocumentResult<InfospotIcons>, Document {
    user_id:string,
    name: string
    icon: string,
    status: number,
}
export interface AdminAvatar extends DocumentResult<AdminAvatar>, Document {
    user_id:string,
    gender:string,
    name: string
    avatar: string,
    status: number,
}

export interface UserProfile extends DocumentResult<UserProfile>, Document {
    user_id: mongoose.Schema.Types.ObjectId,
    photo: string,
   
    website: string,
    facebook_link: string,
    instagram_link: string,
    twitter_link: string,
    location: string,
    about: string,
    address: string,
    city: string,
    state: string,
    country: string,
    pincode: string,
    status: number,
    created_at: string,
    updated_at: string,
}


export interface Infospot extends DocumentResult<Infospot>, Document {
    title: string,
    description: string,
    tour_id: mongoose.Schema.Types.ObjectId,
    scene_id: mongoose.Schema.Types.ObjectId,
    icon: mongoose.Schema.Types.ObjectId,
    type: number,
    video_url: string,
    url_title: string,
    url: string,
    image: string,
    x_axis: string,
    y_axis: string,
    z_axis: string,
    status: number,
}


export interface Pano extends DocumentResult<Pano>, Document {
    tour_id: mongoose.Schema.Types.ObjectId
    scene_id: mongoose.Schema.Types.ObjectId,
    image: string,
    x_axis: string,
    y_axis: string,
    z_axis: string,
    scale: number,
    status: number,
}
export interface CustomLogo extends DocumentResult<CustomLogo>, Document {
    tour_id: mongoose.Schema.Types.ObjectId,
    logo: string,
    status: number
}

export interface CameraPosition extends DocumentResult<CameraPosition>, Document {
    tour_id: mongoose.Schema.Types.ObjectId,
    scene_id: mongoose.Schema.Types.ObjectId,
    zoom_level: number,
    h_angle: string,
    v_angle: string,
}

export interface PaymentPlan extends DocumentResult<PaymentPlan>, Document {
    plan_name: string,
    plan_type: number,
    tour_limit: number,
    tour_scenes_limit:number,
    paypal_plan_id: string,
    stripe_price_id: string,
    plan_price: number,
    plan_status: number,
    interval: string,
}

export interface PaymentTransaction extends DocumentResult<PaymentTransaction>, Document {
    user_id: mongoose.Schema.Types.ObjectId,
    amount: number,
    transaction_message: string,
    gateway_type: string,
    transaction_id: string,
    transaction_status: number,
}

export interface PaymentDescription extends DocumentResult<PaymentDescription>, Document {
    plan_id: mongoose.Schema.Types.ObjectId,
    plan_desc: string,
    plan_status:number,
}

export interface Subscription extends DocumentResult<Subscription>, Document {
    user_id: mongoose.Schema.Types.ObjectId,
    stripe_cus_id: string,
    plan_id: string,
    plan_name: string,
    plan_type_id: string,
    stripe_plan_id: string,
    isSubscribed: boolean,
    isFreePlan:boolean,
    isTrial: boolean,
    interval: string,
    interval_count: number,
    subscription_id: string,
    subscription_method: number,
    cancel_request: boolean,
    subscription_start: string,
    subscription_end: string,
    trial_start: string,
    trial_end: string,
    next_billing_time: string,
    created_at: string,
    updated_at: string,
}


export interface TourInteractions extends DocumentResult<TourInteractions>, Document {
    tour_id: mongoose.Schema.Types.ObjectId,
    likes: [{
        user_id: string,
        isTourLiked: boolean,
        like_at: string,
        unlike_at: string,
        created_at: string,
        updated_at: string,

    }],
    comments: [{
        user_id: string,
        comment: string,
        comment_at: string,
        created_at: string,
        updated_at: string,

    }],
    view_by: [{
        user_id: string,
        user_ip_address:string,
        view_at: string,
        created_at: string,
        updated_at: string,

    }]

}

export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
}

export interface Avatar extends DocumentResult<Avatar>, Document {
    tour_id: mongoose.Schema.Types.ObjectId
    scene_id: mongoose.Schema.Types.ObjectId
    avatar: mongoose.Schema.Types.ObjectId,
    avatar_speech_text: string,
    avatar_speech_audio: string,
    speech_type: number,
    x_axis: string,
    y_axis: string,
    status: number,
    created_at: string,
    updated_at: string,
}

// COMMUNITY
export interface CommunityQuestion extends DocumentResult<CommunityQuestion>, Document {
    user_id: mongoose.Schema.Types.ObjectId
    status: number,
    question: string,
    viewed_by: [{
        user_id: string,
        viewed_at: string,
        created_at: string,
        isQuestionViewed: boolean,
        updated_at: string,

    }],
    liked_by: [{
        user_id: string,
        isQuestionLiked: boolean,
        liked_at: string,
        unliked_at: string,
        created_at: string,
        updated_at: string
    }],
    disliked_by: [{
        user_id: string,
        disliked_at: string,
        undisliked_at: string,
        isQuestionDisliked: boolean,
        created_at: string,
        updated_at: string
    }]
    created_at: string,
    updated_at: string,
}

export interface CommunityAnswers extends DocumentResult<CommunityAnswers>, Document {
    user_id: mongoose.Schema.Types.ObjectId
    question_id: mongoose.Schema.Types.ObjectId
    status: number,
    answer: string,
    reply: [{
        user_id: string,
        replied_answer: string,
        isRepliedAnswer: boolean,
        created_at: string,
        updated_at: string
    }],
    answer_by: string,
    answer_at: string,
    created_at: string,
    updated_at: string
}


export interface TourExploreStatusType extends DocumentResult<TourExploreStatusType>, Document {
    tour_explore_status_type_id: number,
    tour_explore_status_type_name: string
    created_at: string,
    updated_at: string
}

