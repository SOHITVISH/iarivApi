import { DateTime } from "luxon";
import userModel from "../../model/user/userModel";
import getisotime from "../../utils/time";
import { validateEmail, validatePassword } from "../../utils/validation";
import MailSendCustomer from "../email/email";
import userModelLog from "../../model/log/user/userModelLog";
import jwt, { JwtPayload } from "jsonwebtoken"
import { log } from "../../index";
import bcrypt from "bcryptjs"
import { RequestHandler } from "express";
import { link } from "fs";
import subscription from "../../model/subscription/subscription";
import tourModel from "../../model/tour/tourModel";
import { now } from "mongoose";
import paymentPlanModel from "../../model/payment/paymentPlan";
import subscriptionHistory from "../../model/subscription/subscriptionHistory";
import userProfileModel from "../../model/user/userProfileModel";

let secret: string | undefined = process.env.DB_AUTH_SECRET

const signup: RequestHandler = async (req, res) => {
    let date = getisotime(DateTime)
    let { email, name, password, location, timezone } = req.body

    if (!email) {
        return res.status(400).json({ message: 'Please provide email' });
    }
    if (!name) {
        return res.status(400).json({ message: 'Please provide valid name' });
    }
    if (!password) {
        return res.status(400).json({ message: 'Please provide password' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Please provide valid email' });
    }
    if (!validatePassword(password)) {
        return res.status(400).json({ message: 'Password must be between 7 to 15 characters and contain at least one numeric digit and a special character' });
    }




    try {
        const oldUser = await userModel.findOne({ email });
        if (oldUser) {
            return res.status(400).json({ message: "User already exists" });
        }


        let hashedCode = await bcrypt.hash(password, 12)
        let result = await userModel.create({
            name,
            email,
            password: hashedCode,
            location,
            signup_method:60,
            timezone
        });


        if (result) {
            let profile = await userProfileModel.create({
                user_id: result._id,
              
                location: "",
                address: "",
                city: "",
                state: "",
                country: "",
                website: "",
                instagram_link: "",
                facebook_link: "",
                twitter_link: "",
                about: ""
            })
        }

        let freeplan: any = await paymentPlanModel.findOne({ plan_price: 0, plan_status: 20 })

        const new_subscription = await subscription.create({
            user_id: result._id,
            isTrial: true,
            trial_start: date,
            plan_type_id: freeplan._id,
            trial_end: DateTime.now().toUTC().plus({ days: 15 }).toISO()
        })


        // createing log for subscription
        if (new_subscription) {
            let { _id, ...history } = new_subscription._doc
            await subscriptionHistory.create({
                ...history,
            })
        }

        var sendMail = {
            from: `Virtual Tour ${process.env.SENDER_EMAIL}`,
            to: req.body.email,
            subject: "iAriv - Email verification code",
            template: "sendEmail",
            context: {
                link: `${process.env.API_URL}api/verifyemail?user_id=${result._id}`
            }
        };
        MailSendCustomer(sendMail)

        const updateduser = await userModel.findById(result._id)
        if (updateduser) {
            const { _id, ...userupdated } = updateduser._doc
            await userModelLog.create({
                user_id: updateduser._id,
                ...userupdated
            })
        }

        log.info(`${email} signup successfully`)
        res.status(200).json({ message: "Signup successfully" })

    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
        log.error(`${email} failed to signup ` + error)
    }
}
export const verifyEmailLink: RequestHandler = async (req, res) => {
    const user = await userModel.findOne({ email: req.body.email })
    try {
        if (user) {
            var sendMail = {
                from: `Virtual Tour ${process.env.SENDER_EMAIL}`,
                to: req.body.email,
                subject: "Verification code",
                template: "sendEmail",
                context: {
                    link: `${process.env.API_URL}api/verifyemail?user_id=${user._id}`
                }
            };
            MailSendCustomer(sendMail)
            return res.status(200).json({ message: "Please check your email !!" })
        } else {
            return res.status(400).json({ message: "User not found !!" })
        }

    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong !!" })
    }
}



export const getsingleuser: RequestHandler = async (req, res) => {
    try {
        let { token } = req.session
        console.log(token, "--token");
        if (token && secret) {
            let decode: any = jwt.verify(token, secret)
            if (decode) {
                let user = await userModel.findOne({ email: decode.email, user_type_id: 51 })
                let profile = await userProfileModel.findOne({ user_id: user?._id })
                let photo = profile?.photo
                if (!user) {
                    return res.status(400).json({ message: "User doesn't exist" })
                } else {
                    return res.status(200).json({ message: "Log in user information", data: { ...user?._doc, photo } })
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


export const getCount: RequestHandler = async (req, res) => {
    try {

        const usersCount = await userModel.find({ status: 1 }).countDocuments();
        const publishedToursCount = await tourModel.find({ status: 4 }).countDocuments();
        const draftToursCount = await tourModel.find({ status: 2 }).countDocuments();

        return res.status(200).json({ totalUsersCount: usersCount, totalPublishedTour: publishedToursCount, totalDraftTour: draftToursCount })

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}


export const updateProfile: RequestHandler = async (req, res) => {
    let { current_photo, user_id, name, address, city, state, country, pincode, location, website, instagram_link, facebook_link, twitter_link, about } = req.body

    try {

        let check = await userModel.findById(user_id)

        if (!check) {
            return res.status(400).json({ message: 'Invalid user' });
        }

        let filename = current_photo;
        if (req.file) {
            filename = req.file.filename
        }

        let checkuser = await userProfileModel.findOne({ user_id: user_id })

        if (checkuser) {
            let updatepro = await userProfileModel.findOneAndUpdate({ user_id }, { photo: filename, user_id, name, address, city, state, country, pincode, location, website, instagram_link, facebook_link, twitter_link, about }, { new: true })
            return res.status(200).json({ message: "Profile update successfully", data: updatepro })

        } else {

            let doc = await userProfileModel.create({
                user_id,
                photo: filename,
                name,
                address,
                city,
                state,
                country,
                pincode,
                location,
                website,
                instagram_link,
                facebook_link,
                twitter_link,
                about

            })
            return res.status(200).json({ message: "Profile added successfully", data: doc })

        }

    } catch (error) {
        return res.status(400).json({ message: "Something went wrong" + error })
    }
}

export const singleUserProfile: RequestHandler = async (req, res) => {
    let { user_id } = req.body

    try {
        let check = await userModel.findById(user_id)

        if (!check) {
            return res.status(400).json({ message: 'Invalid user' });
        }

        let result: any = await userProfileModel.findOne({ user_id: user_id })
        if (!result) {
            return res.status(400).json({ message: 'No info found' });

        }
        res.status(200).json({ message: "User profile info fetch successfully", data: result })

    } catch (error) {
        return res.status(400).json({ message: "Something went wrong" + error })
    }
}




export default signup