import express, { RequestHandler } from "express";
import signup, { getCount, getsingleuser, singleUserProfile, updateProfile, verifyEmailLink } from "../controllers/session/signup";
import { createtour, addInfospot, addLinkage, createcategory, deleteCustomLogo, deleteInfospot, deleteLargeFolder, deleteLinkage, deletePano, deleteTour, editInfospot, editLinkage, editPano, editTour, getCategory, getCustomLogo, getInfospots, getLinkages, getSingleTour, getTour, getTourScenes, setCameraPostion, setCustomLogo, setPano, updateScene, uploadScenes, getPano, getCameraPostion, setPriority, updateThumb, deleteScene, likeTour, viewTour, commentsTour, unlikeTour, editcomment, setAvatar, getAvatar, editAvatar, deleteAvatar, getPublishedTour, getUserTours, getSingleCategory, deleteCategory, allCategory, updateTourStatus, getTourByStatus, restoreTour, restoreScene, restoreCategory } from "../controllers/tours/tour";
import signin, { verifyEmail, getUserDetails, googleSignin, facebookSignin } from "../controllers/session/signin";
import auth from "../controllers/middleware/auth";
import signout, { changepassword } from "../controllers/session/signout";
import { uploadTourScene } from "../controllers/middleware/uploadTourScene";
import { addScenes } from "../controllers/middleware/addScenes";
import { MulterError } from "multer";
import { uploadinfospotImages } from "../controllers/middleware/infospotImageMid";
import { customlogo } from "../controllers/middleware/customLogo";
import { panoImage } from "../controllers/middleware/panoImage";
import { uploadThumbnail } from "../controllers/middleware/tourThumbMid";
import { cancelSubscription, createCustomer, getCurentPlan, getSubscriptionData, renewSubscription } from "../controllers/stripe/stripe";
import { cancelsubscription, getsubscriptiondetails, plansubscription } from "../controllers/paypal/paypal";

import { addAdminAvatar, addInfospotIcon, addlinkageicon, adminBlockTour, adminBlockUser, adminDeleteUser, adminGetSingleUser, adminGetTour, adminRestoreUser, adminSearchCategory, adminSearchTour, adminSearchUser, adminSignin, adminSignout, adminUnblockTour, adminUnblockUser, admingetuser, deleteAdminAvatar, deleteInfospotIcon, deletelinkageicon, filterPayment, getAdminAvatar, getAdminsingleuser, getAllAdminAvatar, getBypaymentgateway, getInfospotIcon, getInfospotIconForAdmin, getlinkageicon, getlinkageiconForAdmin, getuserpayment, restoreAdminAvatar, restoreInfospotIcon, restorelinkageicon, searchAvatar, searchInfospotIcon, searchlinkageicon, singleuserdetails, singleusersubscription } from "../controllers/admin/admin";

import { addPlan, addPlanDesc, deletePlan, deletePlanDesc, getPlan, getPlanAdmin, getPlanDesc, getPlanWithDesc, restorePlan } from "../controllers/plan/plan";
import { getObjectUrl, uploadOnS3 } from "../controllers/s3/s3";
import { avatarSpeechAudio } from "../controllers/middleware/avatarSpeechAudio";
import { answerdelete, askquestion, deletequestion, dislikequestion, editanswer, getanswer, getdislikesofquestion, getlikesofquestion, getrepliedanswer, getreplycount, gettotalviewsofquestion, giveanswer, likequestion, replydelete, replyonanswer } from "../controllers/community/community";
import { getExploreTour, getTourExploreStatusType, tourExploreStatusType, tourMoveTo } from "../controllers/tourExplore/tourExploreCategory";
import { adminLinkageIcon } from "../controllers/middleware/adminLinkageIcon";
import { uploadProfilePic } from "../controllers/middleware/profileImage";
import { adminInfospotIcon } from "../controllers/middleware/adminInfospotIcon";
import { adminAvatar } from "../controllers/middleware/adminAvatar";
import ipMiddleware from "../controllers/middleware/ipaddress";


const router = express.Router();




// middleware for scene add on tour create
const uploadScenesCheck = uploadTourScene.array('scenes', 5);

const uploadScenesCheckMid: RequestHandler = (req, res, next) => {
    uploadScenesCheck(req, res, (err: MulterError) => {
        if (err) {
            let message = "Failed to upload files !!";
            if (err.code === "LIMIT_FILE_COUNT") {
                message = "Please upload upto 5 files only."
            } else if (err.code === "LIMIT_FILE_SIZE") {
                message = "Selected file too large."
            }
            return res.status(500).json({ message })
        } else {
            next();
        }
    })
}


// middleware for scene add

const addScenesCheck = addScenes.array('scenes', 10);

const addScenesCheckMid: RequestHandler = (req, res, next) => {
    addScenesCheck(req, res, (err: MulterError) => {
        if (err) {
            let message = "Failed to upload files !!";
            if (err.code === "LIMIT_FILE_COUNT") {
                message = "Please upload upto 10 files only."
            } else if (err.code === "LIMIT_FILE_SIZE") {
                message = "Selected file too large."
            }
            return res.status(500).json({ message })
        } else {
            next();
        }
    })
}




// Auth releted apies
router.get("/verifyemail", verifyEmail)
router.post("/email-verify-link", verifyEmailLink)
router.post("/signup", signup)
router.post("/signin", signin)
router.get("/get-user-details", getUserDetails)
router.post("/getsingleuser", getsingleuser)
router.post("/signout", signout)
router.get("/get-count", getCount)
router.post("/change-password", changepassword)
// router.post("/add-profile-info", addProfileInfo)
// router.post("/edit-profile", editProfile)
router.post("/update-profile", uploadProfilePic.single('photo'), updateProfile)
router.post("/single-user-profile", singleUserProfile)
router.post("/signin-google", googleSignin)
router.post("/signin-facebook", facebookSignin)



// Tour releted apies
router.post("/createtour", createtour)
router.post("/edit-tour", editTour)
router.post("/get-tour", getTour)
router.post("/delete-tour", deleteTour)
router.post("/restore-tour", restoreTour)
router.post("/get-single-tour", getSingleTour)
router.post("/update-tour-thumb", uploadThumbnail.single('thumb'), updateThumb)
router.get("/get-all-publish", getPublishedTour)
router.post("/get-user-tours", getUserTours)
router.post("/update-tour-status", updateTourStatus)
router.post("/get-tour-by-status", getTourByStatus)



// category apies
router.post("/createcategory", createcategory)
router.post("/get-single-category", getSingleCategory)
router.post("/delete-category", deleteCategory)

router.post("/restore-category", restoreCategory)
router.get("/get-categories/:page", getCategory)
router.get("/all-categories", allCategory)

// scene apies
router.post("/upload-scene", uploadScenesCheckMid, uploadScenes)
router.post("/add-scenes", addScenesCheckMid, uploadScenes)
router.post("/update-scene", updateScene)
router.post("/set-scene-priority", setPriority)
router.post("/get-all-scenes", getTourScenes)
router.post("/delete-scene", deleteScene)
router.post("/restore-scene", restoreScene)

// linkage apies
router.post("/add-linkage", addLinkage)
router.post("/edit-linkage", editLinkage)
router.post("/delete-linkage", deleteLinkage)
router.post("/get-linkages", getLinkages)

// infospot apies
router.post("/add-infospot", uploadinfospotImages.single('image'), addInfospot)
router.post("/edit-infospot", uploadinfospotImages.single('image'), editInfospot)
router.post("/delete-infospot", deleteInfospot)
router.post("/get-infospots", getInfospots)

// pano apies
router.post("/set-pano", panoImage.single('image'), setPano)
router.post("/edit-pano", editPano)
router.post("/delete-pano", deletePano)
router.post("/get-pano", getPano)

// custom logo apies
router.post("/set-custom-logo", customlogo.single('logo'), setCustomLogo) //this code will work for create and edit custom logo
router.post("/delete-custom-logo", deleteCustomLogo)
router.post("/get-custom-logo", getCustomLogo)



// camera position apies
router.post("/set-camera-position", setCameraPostion)
router.post("/get-camera-position", getCameraPostion)

// general apis
router.post("/delete-large-folder", deleteLargeFolder)

// s3 apies
router.post("/tour-publish-on-s3", uploadOnS3)
router.post("/get-presigned-url", getObjectUrl)


//plan description apies
router.post("/add-plan-desc", addPlanDesc)
router.post("/get-plan-desc", getPlanDesc)
router.post("/delete-plan-desc", deletePlanDesc)

//plan apies
router.post("/add-plan", addPlan)
router.get("/get-plan", getPlan)
router.get("/get-plan-admin", getPlanAdmin)
router.post("/delete-plan", deletePlan)
router.post("/restore-plan", restorePlan)


// stripe payment related apies
router.post("/create-stripe-customer", createCustomer)
router.post("/get-subscription-data", getSubscriptionData)
router.post("/cancel-stripe-subscription", cancelSubscription)
router.post("/renew-stripe-subscription", renewSubscription)
router.post("/get-current-plan", getCurentPlan)




//tour interaction
router.post("/like-tour", likeTour)
router.post("/unlike-tour", unlikeTour)
router.post("/view-tour", ipMiddleware, viewTour)
router.post("/comment-tour", commentsTour)
router.post("/edit-comment", editcomment)


// avatar apies
router.post("/set-avatar", avatarSpeechAudio.single('avatar_speech_audio'), setAvatar)
router.post("/get-avatar", getAvatar)
router.post("/edit-avatar", avatarSpeechAudio.single('avatar_speech_audio'), editAvatar)
router.post("/delete-avatar", deleteAvatar)


// paypal related api's

router.post("/plan-subscription", plansubscription)
router.post("/cancel-subscription", cancelsubscription)
router.post("/get-subscription-details", getsubscriptiondetails)
router.post("/single-user-subscription", singleusersubscription)



//ADMIN ROUTE

router.post("/admin-signin", adminSignin)
router.post("/admin-signout", adminSignout)
router.get("/admin-get-tour/:page", adminGetTour)
router.get("/admin-get-user/:page", admingetuser)
router.post("/admin-get-single-user", adminGetSingleUser)
router.post("/admin-delete-user", adminDeleteUser)
router.post("/admin-restore-user", adminRestoreUser)
router.post("/admin-block-user", adminBlockUser)
router.post("/admin-unblock-user", adminUnblockUser)
router.post("/single-user-details", singleuserdetails)
router.post("/admin-block-tour", adminBlockTour)
router.post("/admin-unblock-tour", adminUnblockTour)
router.post("/admin-search-tour", adminSearchTour)
router.post("/admin-search-user", adminSearchUser)
router.post("/admin-search-category", adminSearchCategory)
router.post("/get-user-by-payment-gateway", getBypaymentgateway)
router.get("/get-user-payment/:page", getuserpayment)
router.post("/filter-payment", filterPayment)

//admin add linkage icon
router.post("/add-linkage-icon", adminLinkageIcon.single('icon'), addlinkageicon)
router.post("/delete-linkage-icon", deletelinkageicon)
router.post("/restore-linkage-icon", restorelinkageicon)
router.post("/get-linkage-icon", getlinkageicon)
router.get("/get-linkage-icon-admin/:page", getlinkageiconForAdmin)
router.post("/search-linkage-icon", searchlinkageicon)

//admin add infospot icon
router.post("/add-infospot-icon", adminInfospotIcon.single('icon'), addInfospotIcon)
router.post("/delete-infospot-icon", deleteInfospotIcon)
router.post("/restore-infospot-icon", restoreInfospotIcon)
router.post("/get-infospot-icon", getInfospotIcon)
router.get("/get-infospot-icon-admin/:page", getInfospotIconForAdmin)
router.post("/search-infospot-icon", searchInfospotIcon)


// admin add avtar
router.post("/add-avatar-admin", adminAvatar.single('avatar'), addAdminAvatar)
router.post("/delete-avatar-admin", deleteAdminAvatar)
router.post("/restore-avatar-admin", restoreAdminAvatar)
router.post("/get-avatar-admin", getAdminAvatar)
router.get("/get-all-avatar-admin/:page", getAllAdminAvatar)
router.post("/search-avatar", searchAvatar)


//some important admin api
router.post("/admin-getsingleuser", getAdminsingleuser)
router.get("/get-plan-with-desc", getPlanWithDesc)




//TOUR EXPLORE CATEGORY STATUS TYPE

router.post("/tour-explore-status-type", tourExploreStatusType)
router.get("/get-tour-explore-status-type", getTourExploreStatusType)
router.post("/tour-move-to", tourMoveTo)
router.post("/get-explore-tours/:page", getExploreTour)



//COMMUNITY

router.post("/ask-question", askquestion)
router.post("/delete-question", deletequestion)
router.post("/like-question", likequestion)
router.post("/dislike-question", dislikequestion)
router.post("/give-answer", giveanswer)
router.post("/delete-answer", answerdelete)
router.post("/edit-answer", editanswer)
router.post("/get-answer", getanswer)
router.post("/get-likes", getlikesofquestion)
router.post("/get-dislikes", getdislikesofquestion)
router.post("/get-question-views", gettotalviewsofquestion)
router.post("/reply-answer", replyonanswer)
router.post("/get-replied-answer", getrepliedanswer)
router.post("/get-reply-count", getreplycount)
router.post("/reply-delete", replydelete)


export default router;