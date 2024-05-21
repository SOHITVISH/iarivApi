import { RequestHandler } from "express";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import userModel from "../../model/user/userModel";
import getisotime from "../../utils/time";
import { DateTime } from "luxon";
import tourModel from "../../model/tour/tourModel";
import tourSceneModel from "../../model/tour/tourSceneModel";
import { log } from '../../index';
import categoryModel from "../../model/tour/categoryModel";
import { rmSync } from "fs";
import planTransactionModel from "../../model/payment/paymentTransaction";
import paymentTransactionModel from "../../model/payment/paymentTransaction";
import subscriptionModel from "../../model/subscription/subscription";
import linkageIconsModel from "../../model/tour/linkageIconsModel";
import { resourceUsage } from "process";
import paymentPlanModel from "../../model/payment/paymentPlan";
import infospotIconsModel from "../../model/tour/infospotIconModel";
import userProfileModel from "../../model/user/userProfileModel";
import adminAvatarModel from "../../model/tour/adminAvatarModel";


let secret: string | undefined = process.env.DB_AUTH_SECRET
export const adminSignin: RequestHandler = async (req, res) => {

    let { email, password } = req.body

    if (!email) {
        return res.status(400).json({ message: 'Please provide valid email' });
    }
    if (!password) {
        return res.status(400).json({ message: 'Please provide password' });
    }

    try {
        const user = await userModel.findOne({ email, user_type_id: 50 });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }


        const isPassowordCorrect = await bcrypt.compare(password, String(user.password))


        if (!isPassowordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        let token
        if (secret) {
            token = jwt.sign({ email, user_id: user._id }, secret, { expiresIn: "7d" });
            req.session.token = token
        }
        // res.cookie("token", token, { maxAge: 1000 * 60 * 60, secure: true })
        log.info(`Admin Signin successfully`)
        res.status(200).json({ message: "Admin Signin successfully", userData: user, token })

    } catch (error) {
        log.error(`Admin Signin failed  ${error}`)
        return res.status(400).json({ message: "Something went wrong" + error })

    }
}

export const adminSignout: RequestHandler = async (req, res) => {
    let date = getisotime(DateTime)
    let secret = process.env.DB_AUTH_SECRET || "xtsecure" //change it

    try {
        if (!req.session?.token) {
            return res.status(400).json({ message: "You have already signed out" })
        }

        let tokenData: any = jwt.verify(req.session.token, secret)
        let { email, user_id } = tokenData
        console.log(email, user_id);
        let loggedinstatus = await userModel.findOneAndUpdate({ email }, { isSignIn: false, updated_at: date, updated_by: user_id }, { new: true }) // add updated by 
        req.session.destroy(() => { })
        log.info(`Admin Signout successfully`)
        res.status(200).json({ message: "SignOut Succesfully " })



    } catch (error) {
        log.error(`Admin Signout failed  ${error}`)
        return res.status(400).json({ message: "Something went wrong " + error })
    }
}

export const admingetuser: RequestHandler = async (req, res) => {

    const resultsPerPage = 10;

    const pages: number = parseInt(req.params.page);
    let page = pages >= 1 ? pages : 1;
    page = page - 1
    try {

        let result: any = []
        const userdoc = await userModel.find({ status: { $ne: 0 } }).sort({ createdAt: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page);
        const userscount = await userModel.find({ status: { $ne: 0 } }).sort({ createdAt: -1, _id: -1 }).countDocuments()


        for (let index = 0; index < userdoc.length; index++) {
            const element = userdoc[index];
            const user_id = element._id;


            let userPic = await userProfileModel.findOne({ user_id: user_id })

            let photo = userPic?.photo


            result.push({ ...element._doc, photo })
        }

        return res.status(200).json({ message: "Users fetch by admin Succesfully !!", data: result, usersCounts: userscount })


    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}

export const adminGetTour: RequestHandler = async (req, res) => {
    const resultsPerPage = 10;

    const pages: number = parseInt(req.params.page);
    let page = pages >= 1 ? pages : 1;
    page = page - 1

    try {
        let result: any = [];

        const tours = await tourModel.find({}).sort({ createdAt: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page);
        const tourscount = await tourModel.find({}).sort({ createdAt: -1, _id: -1 }).countDocuments()
        for (let index = 0; index < tours.length; index++) {
            const element = tours[index];
            const tour_id = element._id;
            const user_id = element.user_id;
            const category = element.category;

            let scendata = await tourSceneModel.findOne({ tour: tour_id })
            let userdata = await userModel.findOne({ _id: user_id })
            let tourcategory = await categoryModel.findOne({ _id: category })
            let username = userdata?.name
            let categoryname = tourcategory?.name


            result.push({ tourData: { ...element._doc, username, categoryname }, sceneData: scendata })
        }

        return res.status(200).json({ message: "Tour fetch by admin Succesfully !!", data: result, toursCount: tourscount })

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}

export const adminBlockTour: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {
        let checkTour = await tourModel.findById(id)

        if (!checkTour) {
            return res.status(400).json({ message: "Tour doesn't exist" })
        }

        let tour = await tourModel.findByIdAndUpdate(id, { isTourBlock: true }, { new: true })

        res.status(200).json({ message: "Tour successfully blocked by admin" })
    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}
export const adminUnblockTour: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {
        let checkTour = await tourModel.findById(id)

        if (!checkTour) {
            return res.status(400).json({ message: "Tour doesn't exist" })
        }
        let tour = await tourModel.findByIdAndUpdate(id, { isTourBlock: false }, { new: true })
        res.status(200).json({ message: "Tour successfully unblocked by admin" })
    } catch (error: any) {
        return res.status(500).json({ message: error.message })
    }
}

export const adminGetSingleUser: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {

        let user = await userModel.findById(id)

        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" })
        }

        res.status(200).json({ message: "Single user fetch by admin successfully !!", result: user })

    } catch (error: any) {

        return res.status(400).json({ message: error.message })

    }
}

export const adminDeleteUser: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {
        let user = await userModel.findByIdAndUpdate(id)

        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" })
        } else {
            await userModel.findByIdAndUpdate(id, { status: -1 }, { new: true })
        }


        res.status(200).json({ message: "User deleted by admin successfully" })

    } catch (error: any) {
        return res.status(400).json({ message: error.message })
    }
}

export const adminRestoreUser: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {
        let user = await userModel.findByIdAndUpdate(id)

        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" })
        } else {
            await userModel.findByIdAndUpdate(id, { status: 1 }, { new: true })
        }

        res.status(200).json({ message: "User restore by admin successfully" })

    } catch (error: any) {
        return res.status(400).json({ message: error.message })
    }
}

export const adminBlockUser: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {
        let user = await userModel.findByIdAndUpdate(id)

        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" })
        } else {
            await userModel.findByIdAndUpdate(id, { status: -18 }, { new: true })
        }


        res.status(200).json({ message: "User blocked by admin successfully" })

    } catch (error: any) {
        return res.status(400).json({ message: error.message })
    }
}

export const adminUnblockUser: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {
        let user = await userModel.findByIdAndUpdate(id)

        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" })
        } else {
            await userModel.findByIdAndUpdate(id, { status: 1 }, { new: true })
        }


        res.status(200).json({ message: "User unblocked by admin successfully" })

    } catch (error: any) {
        return res.status(400).json({ message: error.message })
    }
}

export const singleuserdetails: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {

        let userTours: any = [];
        let userpublishedtourss: any = [];
        let userdrafttourss: any = [];
        let userprivatetourss: any = [];
        let usersubscription: any = {}
        let userinfo: any = await userModel.findById(id)
        let userTour = await tourModel.find({ user_id: id })
        let userTourCount = await tourModel.find({ user_id: id }).countDocuments()
        const userpublishedtours = await tourModel.find({ user_id: id, status: 4 })
        const userpublishedtoursCount = await tourModel.find({ user_id: id, status: 4 }).countDocuments()
        const userdrafttours = await tourModel.find({ user_id: id, status: 2 })
        const userdrafttoursCount = await tourModel.find({ user_id: id, status: 2 }).countDocuments()
        const userprivatetours = await tourModel.find({ user_id: id, status: 6 })
        const userprivatetoursCount = await tourModel.find({ user_id: id, status: 6 }).countDocuments()
        const userpayment = await planTransactionModel.find({ user_id: id })
        const usersubs: any = await subscriptionModel.findOne({ user_id: id })

        for (let index = 0; index < userTour.length; index++) {
            const element = userTour[index];
            const category = element.category;
            let tourcategory = await categoryModel.findOne({ _id: category })
            let categoryname = tourcategory?.name
            userTours.push({ ...element._doc, categoryname })

        }
        for (let index = 0; index < userpublishedtours.length; index++) {
            const element = userpublishedtours[index];
            const category = element.category;
            let tourcategory = await categoryModel.findOne({ _id: category })
            let categoryname = tourcategory?.name
            userpublishedtourss.push({ ...element._doc, categoryname })

        }
        for (let index = 0; index < userdrafttours.length; index++) {
            const element = userdrafttours[index];
            const category = element.category;
            let tourcategory = await categoryModel.findOne({ _id: category })
            let categoryname = tourcategory?.name
            userdrafttourss.push({ ...element._doc, categoryname })
        }

        for (let index = 0; index < userprivatetours.length; index++) {
            const element = userprivatetours[index];
            const category = element.category;
            let tourcategory = await categoryModel.findOne({ _id: category })
            let categoryname = tourcategory?.name
            userprivatetourss.push({ ...element._doc, categoryname })
        }


        let planAmount: any = await paymentTransactionModel.findOne({ user_id: usersubs.user_id })
        let amount = planAmount?.amount
        const currentdate = DateTime.fromISO(DateTime.now().toISO())


        const enddate = DateTime.fromISO(usersubs.subscription_end) //subscription end date

        const diff = enddate.diff(currentdate, ["days"])

        let expire_in = Math.floor(diff.days) + " days"

        if (usersubs.isTrial) {
            const enddate = DateTime.fromISO(usersubs.trial_end) //subscription end date

            const diff = enddate.diff(currentdate, ["days"])

            expire_in = Math.floor(diff.days) + " days"
        }

        usersubscription = { ...usersubs._doc, amount, expire_in }

        let userProfile = await userProfileModel.findOne({ user_id: userinfo._id })
        let photo = userProfile?.photo
        userinfo = { ...userinfo._doc, photo }

        res.status(200).json({ userInfo: userinfo, userTour: userTours, userTourCount: userTourCount, userPublishedTours: userpublishedtourss, userpublishedtoursCount: userpublishedtoursCount, userDraftTours: userdrafttourss, userdrafttoursCount: userdrafttoursCount, userPrivateTours: userprivatetourss, userprivatetoursCount: userprivatetoursCount, userPayment: userpayment, userSubscription: usersubscription })

    } catch (error: any) {
        return res.status(400).json({ message: error.message })

    }
}

export const adminSearchTour: RequestHandler = async (req, res) => {
    let { searchTerm } = req.body;

    try {
        let result: any = [];
        let pattern = new RegExp(searchTerm, "i");

        let tours = await tourModel
            .find({
                $and: [
                    {
                        $or: [
                            { name: { $regex: pattern } },
                            { description: { $regex: pattern } },
                        ],
                    },
                ],
            })
            .sort({ created_at: -1, _id: -1 });
        let resultcount = await tourModel
            .find({
                $and: [
                    {
                        $or: [
                            { name: { $regex: pattern } },
                            { description: { $regex: pattern } },
                        ],
                    },
                ],
            })
            .countDocuments();

        for (let index = 0; index < tours.length; index++) {
            const element = tours[index];
            const tour_id = element._id;
            const user_id = element.user_id;
            const category = element.category;

            let scendata = await tourSceneModel.findOne({ tour: tour_id });
            let userdata = await userModel.findOne({ _id: user_id });
            let tourcategory = await categoryModel.findOne({ _id: category });
            let username = userdata?.name;
            let categoryname = tourcategory?.name;

            result.push({
                tourData: { ...element._doc, username, categoryname },
                sceneData: scendata,
            });
        }

        res.status(201).json({
            message: "Tour fetch by admin Succesfully !!",
            data: result,
            toursCount: resultcount,
        });
    } catch (error) {
        return res.status(500).json({ message: "Something went wrong" + error });
    }
};

export const adminSearchUser: RequestHandler = async (req, res) => {
    let { searchTerm } = req.body

    try {
        let pattern = new RegExp(searchTerm, "i")
        let result: any = []
        let userdoc = await userModel.find({ $and: [{ $or: [{ name: { $regex: pattern } }, { email: { $regex: pattern } }] }] }).sort({ created_at: -1, _id: -1 })
        let resultcount = await userModel.find({ $and: [{ $or: [{ name: { $regex: pattern } }, { email: { $regex: pattern } }] }] }).countDocuments()


        for (let index = 0; index < userdoc.length; index++) {
            const element = userdoc[index];
            const user_id = element._id;


            let userPic = await userProfileModel.findOne({ user_id: user_id })

            let photo = userPic?.photo


            result.push({ ...element._doc, photo })
        }


        res.status(200).json({ result, resultcount })
    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong" + error.message })

    }
}

export const adminSearchCategory: RequestHandler = async (req, res) => {
    let { searchTerm } = req.body

    try {
        let pattern = new RegExp(searchTerm, "i")

        let category = await categoryModel.find({ $and: [{ $or: [{ name: { $regex: pattern } }] }] }).sort({ created_at: -1, _id: -1 })
        let categorycount = await categoryModel.find({ $and: [{ $or: [{ name: { $regex: pattern } }] }] }).countDocuments()

        res.status(200).json({ category, categorycount })
    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong" + error.message })

    }
}

export const getBypaymentgateway: RequestHandler = async (req, res) => {
    let { gateway_type } = req.body
    try {
        let paypaluser = await paymentTransactionModel.find({ gateway_type: gateway_type })
        let paypalusercount = await paymentTransactionModel.find({ gateway_type: gateway_type }).countDocuments()

        res.status(200).json({ result: paypaluser, paypalUserCount: paypalusercount })

    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong" + error.message })
    }

}

export const getuserpayment: RequestHandler = async (req, res) => {

    const resultsPerPage = 10;

    const pages: number = parseInt(req.params.page);
    let page = pages >= 1 ? pages : 1;
    page = page - 1
    try {
        let doc = await paymentTransactionModel.find({}).populate("user_id").sort({ createdAt: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page);
        let docCount = await paymentTransactionModel.find({}).populate("user_id").countDocuments()


        let userSubs: any = [];
        for (let index = 0; index < doc.length; index++) {
            const element = doc[index];
            const userID = element.user_id;

            const usersubscriptiondoc = await subscriptionModel.findOne({ user_id: userID })

            userSubs.push({ ...element._doc, usersubscriptiondoc })
        }

        res.status(200).json({ userSubs, docCount })
    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong" + error.message })

    }
}

export const getAdminsingleuser: RequestHandler = async (req, res) => {
    try {
        let { token } = req.session
        console.log(token, "--token");
        if (token && secret) {
            let decode: any = jwt.verify(token, secret)
            if (decode) {
                let user = await userModel.findOne({ email: decode.email, user_type_id: 50 })
                if (!user) {
                    return res.status(400).json({ message: "User doesn't exist" })
                } else {
                    return res.status(200).json({ message: "Log in user information", data: user })
                }

            } else {
                return res.status(400).json({ message: "Access denied !" });
            }
        } else {
            return res.status(400).json({ message: "Access denied ! " });
        }

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
}

export const singleusersubscription: RequestHandler = async (req, res) => {

    let { id } = req.body

    try {
        const usersubscriptiondoc: any = await subscriptionModel.findOne({ user_id: id })
        let subscriptionPlanName: any = ""
        if (usersubscriptiondoc) {

            const usersubscriptionplan = await paymentPlanModel.findById(usersubscriptiondoc?.plan_type_id)
            subscriptionPlanName = usersubscriptionplan?.plan_name

        }


        res.status(200).json({ usersubscriptiondoc: { ...usersubscriptiondoc._doc, subscriptionPlanName } })
    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong" + error.message })

    }
}

export const addlinkageicon: RequestHandler = async (req, res) => {
    let { name, id, current_icon, user_id } = req.body
    user_id = user_id ? user_id : "";
    try {
        let filename = "";
        if (req.file) {
            filename = req.file.filename;
        }

        if (id) {
            filename = current_icon;
            if (req.file) {
                filename = req.file.filename;
            }
            let updateicon = await linkageIconsModel.findByIdAndUpdate(id, { name, icon: filename, user_id }, { new: true })

            return res.status(200).json({ message: "Linkage icon updated successfully", updateicon })

        }
        const result = await linkageIconsModel.create({
            name,
            icon: filename,
            user_id
        });
        return res.status(200).json({ message: "Linkage icon added successfully", result })
    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}

export const deletelinkageicon: RequestHandler = async (req, res) => {
    let { id } = req.body

    try {

        if (id) {

            let updateicon = await linkageIconsModel.findByIdAndUpdate(id, { status: 53 }, { new: true })

            return res.status(200).json({ message: "Linkage icon deleted successfully", updateicon })

        }


    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}

export const restorelinkageicon: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {
        if (id) {
            let updateicon = await linkageIconsModel.findByIdAndUpdate(id, { status: 52 }, { new: true })
            return res.status(200).json({ message: "Linkage icon restored successfully", updateicon })
        }

    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}


export const getlinkageicon: RequestHandler = async (req, res) => {
    const { user_id } = req.body;
    try {

        let geticons = await linkageIconsModel.find({ status: 52, $or: [{ user_id: user_id }, { user_id: "" }] })

        return res.status(200).json({ message: "Linkage icon fetch successfully", data: geticons })
    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}


export const getlinkageiconForAdmin: RequestHandler = async (req, res) => {
    try {
        const page: number = parseInt(req.params.page);
        const perPage = 10;
        const skip = (page - 1) * perPage;

        const geticons = await linkageIconsModel.find({})
            .skip(skip)
            .limit(perPage)
            .sort({ created_at: -1 });


        const count = await linkageIconsModel.find({}).countDocuments();
        return res.status(200).json({ message: "Linkage icon fetch successfully", data: geticons, count: count })
    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}

export const searchlinkageicon: RequestHandler = async (req, res) => {
    let { searchTerm } = req.body

    try {
        let pattern = new RegExp(searchTerm, "i")

        let icons = await linkageIconsModel.find({ $and: [{ $or: [{ name: { $regex: pattern } }] }] }).sort({ created_at: -1, _id: -1 })
        let count = await linkageIconsModel.find({ $and: [{ $or: [{ name: { $regex: pattern } }] }] }).countDocuments()

        res.status(200).json({ icons, count })
    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong" + error.message })

    }
}


//infospot icon
export const addInfospotIcon: RequestHandler = async (req, res) => {
    let { name, id, current_icon, user_id } = req.body
    user_id = user_id ? user_id : "";
    try {
        let filename = "";
        if (req.file) {
            filename = req.file.filename;
        }

        if (id) {
            filename = current_icon;
            if (req.file) {
                filename = req.file.filename;
            }
            let updateicon = await infospotIconsModel.findByIdAndUpdate(id, { name, icon: filename, user_id }, { new: true })

            return res.status(200).json({ message: "Infospot icon updated successfully", updateicon })

        }
        const result = await infospotIconsModel.create({
            name,
            icon: filename,
            user_id
        });
        return res.status(200).json({ message: "Infospot icon added successfully", result })
    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}

export const deleteInfospotIcon: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {
        if (id) {
            let updateicon = await infospotIconsModel.findByIdAndUpdate(id, { status: 55 }, { new: true })
            return res.status(200).json({ message: "Infospot icon deleted successfully", updateicon })
        }

    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}

export const restoreInfospotIcon: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {
        if (id) {
            let updateicon = await infospotIconsModel.findByIdAndUpdate(id, { status: 54 }, { new: true })
            return res.status(200).json({ message: "Infospot icon restored successfully", updateicon })
        }

    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}


export const getInfospotIcon: RequestHandler = async (req, res) => {
    const { user_id } = req.body;
    try {

        let geticons = await infospotIconsModel.find({ status: 54, $or: [{ user_id: user_id }, { user_id: "" }] })

        return res.status(200).json({ message: "Infospot icons fetch successfully", data: geticons })
    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}

export const getInfospotIconForAdmin: RequestHandler = async (req, res) => {
    try {
        const page: number = parseInt(req.params.page);
        const perPage = 10;
        const skip = (page - 1) * perPage;

        const geticons = await infospotIconsModel.find({})
            .skip(skip)
            .limit(perPage)
            .sort({ created_at: -1 });

        const count = await infospotIconsModel.find({}).countDocuments();

        return res.status(200).json({ message: "Infospot icons fetch successfully", data: geticons, count: count })
    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}


export const searchInfospotIcon: RequestHandler = async (req, res) => {
    let { searchTerm } = req.body

    try {
        let pattern = new RegExp(searchTerm, "i")

        let icons = await infospotIconsModel.find({ $and: [{ $or: [{ name: { $regex: pattern } }] }] }).sort({ created_at: -1, _id: -1 })
        let count = await infospotIconsModel.find({ $and: [{ $or: [{ name: { $regex: pattern } }] }] }).countDocuments()

        res.status(200).json({ icons, count })
    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong" + error.message })

    }
}


//admin avatart api's
export const addAdminAvatar: RequestHandler = async (req, res) => {
    let { name, id, current_avatar, user_id, gender } = req.body
    user_id = user_id ? user_id : "";
    try {
        let filename = "";
        if (req.file) {
            filename = req.file.filename;
        }

        if (id) {
            filename = current_avatar;
            if (req.file) {
                filename = req.file.filename;
            }
            let updateavatar = await adminAvatarModel.findByIdAndUpdate(id, { name, avatar: filename, user_id, gender }, { new: true })

            return res.status(200).json({ message: "Avatar updated successfully", updateavatar })

        }
        const result = await adminAvatarModel.create({
            name,
            avatar: filename,
            user_id,
            gender
        });

        return res.status(200).json({ message: "Avatar added successfully", result })
    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}

export const deleteAdminAvatar: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {
        if (id) {
            let updateicon = await adminAvatarModel.findByIdAndUpdate(id, { status: 57 }, { new: true })
            return res.status(200).json({ message: "Avatar deleted successfully", updateicon })
        }

    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}

export const restoreAdminAvatar: RequestHandler = async (req, res) => {
    let { id } = req.body
    try {
        if (id) {
            let updateicon = await adminAvatarModel.findByIdAndUpdate(id, { status: 56 }, { new: true })
            return res.status(200).json({ message: "Avatar restored successfully", updateicon })
        }

    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}

export const getAdminAvatar: RequestHandler = async (req, res) => {
    const { user_id } = req.body;
    try {

        let avatars = await adminAvatarModel.find({ status: 56, $or: [{ user_id: user_id }, { user_id: "" }] })

        return res.status(200).json({ message: "Avatar fetch successfully", data: avatars })
    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}
export const getAllAdminAvatar: RequestHandler = async (req, res) => {
    try {
        const page: number = parseInt(req.params.page);
        const perPage = 10;
        const skip = (page - 1) * perPage;

        const avatars = await adminAvatarModel.find({})
            .skip(skip)
            .limit(perPage)
            .sort({ created_at: -1 });

        const count = await adminAvatarModel.find({}).countDocuments();

        return res.status(200).json({ message: "Avatar fetch successfully", data: avatars, count: count })
    } catch (error) {
        return res.status(400).json({ message: "Something went wrong", error })
    }
}
export const searchAvatar: RequestHandler = async (req, res) => {
    let { searchTerm } = req.body

    try {
        let pattern = new RegExp(searchTerm, "i")

        let icons = await adminAvatarModel.find({ $and: [{ $or: [{ name: { $regex: pattern } }] }] }).sort({ created_at: -1, _id: -1 })
        let count = await adminAvatarModel.find({ $and: [{ $or: [{ name: { $regex: pattern } }] }] }).countDocuments()

        res.status(200).json({ icons, count })
    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong" + error.message })

    }
}

export const filterPayment: RequestHandler = async (req, res) => {
    let { transaction_id="", transaction_status="", gateway_type="", name="", email="", plan_name="" } = req.body
    if (transaction_status == "" && gateway_type == "" && transaction_id == "" && name == "" && email=="" && plan_name=="") {
        return res.status(400).json({message:"At least one field required !"})
    }

    try {
        let doc = await paymentTransactionModel.find({}).populate("user_id").sort({ createdAt: -1, _id: -1 })
        let userSubs: any = [];
        for (let index = 0; index < doc.length; index++) {
            const element = doc[index];
            const userID = element.user_id;
            const usersubscriptiondoc = await subscriptionModel.findOne({ user_id: userID })
            userSubs.push({ ...element._doc, usersubscriptiondoc })
        }
        let result = userSubs
        let result1
        let result2

      
        if (transaction_id != "") {
            result = await userSubs.filter((e: any) => {
                return e.transaction_id == transaction_id
            })
        }
        if (transaction_status != "") {
            result = await userSubs.filter((e: any) => {
                return e.transaction_status == transaction_status
            })
        }
        if (gateway_type != "") {
            result = await userSubs.filter((e: any) => {
                return e.gateway_type == gateway_type
            })
        }
        if (transaction_id != "" && transaction_status != "") {
            result = await userSubs.filter((e: any) => {
                return e.transaction_status == transaction_status && e.transaction_id == transaction_id
            })
        }
        if (transaction_id != "" && gateway_type != "") {
            result = await userSubs.filter((e: any) => {
                return e.gateway_type == gateway_type && e.transaction_id == transaction_id
            })
        }
        if (transaction_status != "" && gateway_type != "") {
            result = await userSubs.filter((e: any) => {
                return e.gateway_type == gateway_type && e.transaction_status == transaction_status
            })
        }

        if (transaction_status != "" && gateway_type != "" && transaction_id != "") {
            result = await userSubs.filter((e: any) => {
                return e.gateway_type == gateway_type && e.transaction_status == transaction_status && e.transaction_id == transaction_id
            })
        }

        result1 = result
        if (name != "") {
            result1 = await result.filter((e: any) => {
                let currentname = e.user_id.name;
                return currentname.match(new RegExp(name,'i'))
            })
        }
        if (email != "") {
            result1 = await result.filter((e: any) => {
                let currentemail = e.user_id.email;
                return currentemail.match(new RegExp(email,'i'))
            })
        }
        if (name != "" && email != "") {
            result1 = await result.filter((e: any) => {
                let currentname = e.user_id.name;
                let currentemail = e.user_id.email;
                return currentname.match(new RegExp(name,'i')) && currentemail.match(new RegExp(email,'i'))
            })
        }
        result2 = result1
        if (plan_name != "") {
            result2 = await result1.filter((e: any) => {
                let currentplan = e.usersubscriptiondoc.interval;
                return currentplan.match(new RegExp(plan_name,'i'))
            })
        }

        let count
        if (result2.length) {

            count = result2.length
        } else {
            return res.status(200).json({ message: 'No record found !!',result:[] });
        }


        res.status(200).json({ result: result2, count })
    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong" + error.message })

    }
}






