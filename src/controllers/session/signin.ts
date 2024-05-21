import userModel from "../../model/user/userModel";
import jwt from "jsonwebtoken";
import { } from "dotenv/config";
import MailSendCustomer from "../email/email";
import userModelLog from "../../model/log/user/userModelLog";
import { log } from "../../index";
import getisotime from "../../utils/time";
import { DateTime } from "luxon";
import bcrypt from "bcryptjs"
import { IRouter, RequestHandler } from "express";
import { url } from "node:inspector";
import { jwtDecode } from "jwt-decode";
import { decode } from "node:punycode";
import userProfileModel from "../../model/user/userProfileModel";
import subscriptionHistory from "../../model/subscription/subscriptionHistory";
import subscriptionModel from "../../model/subscription/subscription";
import paymentPlanModel from "../../model/payment/paymentPlan";
import axios from "axios";
import { OAuth2Client } from 'google-auth-library'

const signin: RequestHandler = async (req, res) => {

    let { email, password } = req.body

    if (!email) {
        return res.status(400).json({ message: 'Please provide valid email' });
    }
    if (!password) {
        return res.status(400).json({ message: 'Please provide password' });
    }
    let secret = process.env.DB_AUTH_SECRET
    let date = getisotime(DateTime)
    try {
        const user = await userModel.findOne({ email: email, user_type_id: 51 });
        console.log(email, "---", user);
        // if(req.session?.token)
        // {
        //     return res.status(400).json({message:"You have already signed in"})
        // }
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        if (Number(user.status) != 1) {
            return res.status(400).json({ message: "Access denied" });
        }
        if (user.signup_method != 60) {
            return res.status(400).json({ message: "Invalid Signin Credential" });
        }
        if (!(user.email_verified)) {
            return res.status(400).json({ message: "Email not verified !!", needVerification: true });
        }



        let code = ""
        // code = String(parseInt(Math.abs(Math.random() * 100000)))

        // if (code.length < 5) {
        //     let i = 2
        //     while (code.length < 5) {
        //         code = code + "" + i
        //         i++
        //     }
        // }

        // var sendMail = {
        //     from: `PlanNmeet ${process.env.SENDER_EMAIL}`,
        //     to: req.body.email,
        //     subject: "Verification code",
        //     template: "sendEmail",
        //     context: {
        //         code,
        //     }
        // };
        // MailSendCustomer(sendMail)
        console.log(password, "------", user.password);
        const isPassowordCorrect = await bcrypt.compare(password, String(user.password))

        if (!isPassowordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" })
        }
        // added isSignIn
        let updated = await userModel.findByIdAndUpdate(user._id, { isSignIn: true, updated_at: date, updated_by: user._id.toString() }, { new: true })

        // let updateduser = await userModel.findById(user._id)
        // let { _id, ...userupdated } = updated._doc
        // await userModelLog.create({
        //     user_id: updated._id,
        //     ...userupdated,
        //     changed_fields: ["isSignIn"]
        // })

        if (secret) {
            let token = jwt.sign({ email, user_id: user._id }, secret, { expiresIn: "7d" });
            req.session.token = token
        }

        //  console.log(req.session,"-----see");

        //   res.end(req.session.token)
        console.log(req.session);
        log.info(`${user.email} signin successfull`)
        res.status(200).json({ message: "Signin successfull", userData: user })

    } catch (error) {
        return res.status(400).json({ message: "Something went wrong" + error })
        log.error(`User signin failed ${error}`)
    }
}

export const verifyEmail: RequestHandler = async (req, res) => {
    let date = getisotime(DateTime)
    let updated = await userModel.findByIdAndUpdate(req.query.user_id, { email_verified: true, email_verified_at: date, updated_at: date, updated_by: req.query.user_id }, { new: true })
    res.render('afteremailverify', { url: process.env.URL + "signin" });
}

export const getUserDetails: RequestHandler = async (req, res) => {
    try {
        // Find user by ID
        console.log(req.query.user_id);
        const user = await userModel.findById(req.query.user_id);
        if (!user) {
            res.status(400).json({ message: "User Not Found" })
        }
        res.status(200).json({ message: "User fetch successfully", userData: user })
    } catch (error) {
        return res.status(400).json({ message: "Something went wrong" })
    }
}

export const googleSignin: RequestHandler = async (req, res) => {
    let { credential } = req.body

    let secret = process.env.DB_AUTH_SECRET
    let date = getisotime(DateTime)

    try {
        if (credential) {

            const client = new OAuth2Client();

            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            console.log(payload, "_______________payload");

            const decoded: any = payload;
            console.log(decoded,"____________decoded");
            
         
            if (decoded.email_verified) {
                let user = await userModel.findOne({ email: decoded.email })

                if (!user) {
                    let result = await userModel.create({
                        name: decoded.name,
                        email: decoded.email,
                        signup_method: 58,
                        isSignIn: true,
                        email_verified:true,
                        google_id_token: credential,
                        google_sub: decoded?.sub

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

                    const new_subscription = await subscriptionModel.create({
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

                    if (secret) {
                        let token = jwt.sign({ email: decoded.email, user_id: result._id }, secret, { expiresIn: "7d" });
                        req.session.token = token
                    }

                    console.log(req.session);
                    log.info(`${result.email} google signin successfull`)
                    res.status(200).json({ message: "Signin successfull", userData: result })


                } else {
                    if (user.signup_method != 58) {
                        return res.status(400).json({ message: "Invalid Signin Credential" });
                    }

                    if (Number(user.status) != 1) {
                        return res.status(400).json({ message: "Access denied" });
                    }


                    let updated = await userModel.findByIdAndUpdate(user._id, { isSignIn: true, updated_at: date, updated_by: user._id.toString(), google_id_token: credential, google_sub: decoded?.sub }, { new: true })


                    if (secret) {
                        let token = jwt.sign({ email: decoded.email, user_id: user._id }, secret, { expiresIn: "7d" });
                        req.session.token = token
                    }


                    console.log(req.session);
                    log.info(`${user.email} gooogle signin successfull`)
                    res.status(200).json({ message: "Signin successfull", userData: user })

                }
            } else {
                return res.status(400).json({ message: "Email not verified" });
            }

        } else {
            return res.status(400).json({ message: "Invalid Signin Credential" });
        }

    } catch (error) {
        return res.status(400).json({ message: "Something went wrong" })
    }
}

export const facebookSignin: RequestHandler = async (req, res) => {
    let { access_token } = req.body

    let secret = process.env.DB_AUTH_SECRET
    let date = getisotime(DateTime)
    try {

        if (!access_token) {
            return res.status(400).json({ message: "Invalid Credential" });
        }

        let ressponse = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${access_token}&fields=name,email&method=get`)

        let userData = ressponse.data
        if (!userData) {
            return res.status(400).json({ message: "Invalid Signin Credential" });
        }

        if (!userData?.email || !userData?.name) {
            return res.status(400).json({ message: "Invalid Signin Credential" });
        }


        let user = await userModel.findOne({ email: userData?.email })

        if (!user) {
            let result = await userModel.create({
                name: userData?.name,
                email: userData?.email,
                signup_method: 59,
                isSignIn: true,
                email_verified:true,
                facebook_access_token: access_token

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

            const new_subscription = await subscriptionModel.create({
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

            if (secret) {
                let token = jwt.sign({ email: userData?.email, user_id: result._id }, secret, { expiresIn: "7d" });
                req.session.token = token
            }

            console.log(req.session);
            log.info(`${result.email} Facebook signin successfull`)
            res.status(200).json({ message: "Facebook signin successfull", userData: result })


        } else {
            if (user.signup_method != 59) {
                return res.status(400).json({ message: "Invalid Signin Credential" });
            }

            if (Number(user.status) != 1) {
                return res.status(400).json({ message: "Access denied" });
            }


            let updated = await userModel.findByIdAndUpdate(user._id, { isSignIn: true, updated_at: date, facebook_access_token: access_token, updated_by: user._id.toString() }, { new: true })


            if (secret) {
                let token = jwt.sign({ email: userData?.email, user_id: user._id }, secret, { expiresIn: "7d" });
                req.session.token = token
            }


            console.log(req.session);
            log.info(`${user.email} Facebook signin successfull`)
            res.status(200).json({ message: "Facebook successfull", userData: user })

        }

    } catch (error) {
        return res.status(400).json({ message: "Something went wrong" + error })
    }
}


export default signin