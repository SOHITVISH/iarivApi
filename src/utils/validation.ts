import { DateTime } from "luxon";
import MailSendCustomer from "../controllers/email/email";
import getisotime from "./time";
import subscriptionModel from "../model/subscription/subscription";
import userModel from "../model/user/userModel";

export const validateEmail = (email: string): boolean => {
    const emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (email !== '' && email.match(emailFormat)) {
        return true;
    } else {
        return false;
    }
}

export const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{7,15}$/;
    return passwordRegex.test(password);
};

export const checktrialEnd = async () => {
    const trial_end_date = DateTime.now().toUTC().plus({ days: 3 }).toISO()
    console.log(trial_end_date);
    const dateonly = trial_end_date.substring(0, 10)
    const subscriptions = await subscriptionModel.find({ trial_end: { $regex: new RegExp(dateonly, 'i') } })
    if (subscriptions.length) {
        for (let i = 0; i < subscriptions.length; i++) {
            const user = await userModel.findById(subscriptions[i].user_id);
            try {
                console.log(user?.email);
                const sendMail = {
                    from: `Virtual Tour ${process.env.SENDER_EMAIL}`,
                    to: user?.email,
                    subject: "UPGRADE ACCOUNT",
                    template: "upgradenotymail",
                };
                MailSendCustomer(sendMail)
            } catch (err: any) {
                console.log(err.message);
                return
            }
        }

    }
    // code for trial end today
    const trial_end_today = DateTime.now().toUTC().toISO()
    const today = trial_end_today.substring(0, 10)
    const end_subscription = await subscriptionModel.find({ trial_end: { $regex: new RegExp(today, 'i') } })
    if (end_subscription.length) {
        for (let i = 0; i < end_subscription.length; i++) {
            const user = await userModel.findById(end_subscription[i].user_id);
            try {
                console.log(user?.email);
                const sendMail = {
                    from: `Virtual Tour ${process.env.SENDER_EMAIL}`,
                    to: user?.email,
                    subject: "Your Trail Will Expire Today",
                    template: "endtrial",
                };
                MailSendCustomer(sendMail)
                await subscriptionModel.findOneAndUpdate({user_id:user?._id},{
                    isTrial:false,
                })
            } catch (err: any) {
                console.log(err.message);
                return
            }
        }

    }

}