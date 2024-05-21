import { RequestHandler } from "express";
import Stripe from "stripe";
import { } from "dotenv/config"
import subscription from "../../model/subscription/subscription";
import userModel from "../../model/user/userModel";
import paymentTransactionModel from "../../model/payment/paymentTransaction";
import subscriptionHistory from "../../model/subscription/subscriptionHistory";
import subscriptionModel from "../../model/subscription/subscription";
import getisotime from "../../utils/time";
import { DateTime } from "luxon";
import paymentPlanModel from "../../model/payment/paymentPlan";


// stripe configuration
const STRIPE_SK = process.env.STRIPE_SK || "";
const stripe = new Stripe(STRIPE_SK);



// payment related code
export const createCustomer: RequestHandler = async (req, res) => {
    let customer;
    let subscriptionInfo: any;
    try {
        let { user_id, name, email, country, state, address, price_id, city, postal_code } = req.body;
        if (!user_id || !name || !email || !country || !state || !address || !price_id) {
            return res.status(400).json({ message: "All user id, name, email, country, state fields are required !!" })
        }
        let customers = await subscription.findOne({
            user_id: user_id,
        });

        if (customers) {
            //checking curent plan and this payment for plan
            const payforplan = await paymentPlanModel.findOne({stripe_price_id:price_id})
            const currentplan = customers.interval;

            if(customers.isSubscribed && currentplan == 'year' && payforplan?.interval == 'month'){
                return res.status(400).json({message:'You have already yearly plan. You can not take monthly plan before end yearly plan.'})
            }
            //ending
            if (customers.stripe_cus_id) {
                customer = await stripe.customers.retrieve(customers.stripe_cus_id);
            } else {
                customer = await stripe.customers.create({
                    name: name,
                    email: email,
                    address: {
                        city: city,//for future
                        postal_code: postal_code,//for future
                        line1: address,
                        state: state,
                        country: country,
                    },
                });
                customers = await subscription.findOneAndUpdate(
                    { user_id: user_id },
                    { stripe_cus_id: customer.id },
                    { new: true }
                )
            }
        }
        if (customer) {
            subscriptionInfo = await stripe.subscriptions.create({
                customer: customer.id,
                items: [
                    {
                        price: price_id,
                    },
                ],
                payment_behavior: "default_incomplete",
                payment_settings: { save_default_payment_method: "on_subscription" },
                expand: ["latest_invoice.payment_intent"],
            });
        }
        const client_secret = subscriptionInfo?.latest_invoice?.payment_intent?.client_secret;
        return res.status(200).json({ subscriptionId: subscriptionInfo?.id, client_secret: client_secret });
    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}
//get subscription data
export const getSubscriptionData: RequestHandler = async (req, res) => {
    const { user_id } = req.body;

    // const page: number = parseInt(req.params.page);
    // const perPage = 10;
    // const skip = (page - 1) * perPage;

    if (!user_id) {
        return res.status(400).json({ message: "User id is required !!" });
    }
    try {
        const result = await subscriptionHistory.find({ user_id }).populate("plan_type_id").sort({ created_at: -1 })
        // .skip(skip).limit(perPage);
        // const resultCount = await subscriptionHistory.find({ user_id }).countDocuments()
        res.status(200).json({ subscription: result });
    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong" + error.message });
    }
}
//cancel subscription 
export const cancelSubscription: RequestHandler = async (req, res) => {
    const { subscription_id } = req.body;
    let planData;
    let subscriptiondata;
    if (!subscription_id) {
        return res.status(400).json({ message: "Subsciption  id is required !!" });
    }
    try {
        const subscriptionget = await stripe.subscriptions.retrieve(
            subscription_id
        );
        if (subscriptionget) {

            subscriptiondata = await stripe.subscriptions.cancel(subscription_id);
        } else {
            return res.status(400).json({ message: "Subsciption not found !!" });
        }
        if (subscriptiondata) {
            let sub = await subscriptionModel.findOne({ subscription_id })
            planData = await paymentPlanModel.findById(sub?.plan_type_id)
            
            await subscriptionHistory.findOneAndUpdate(
                { subscription_id: subscription_id },
                {
                    user_id: sub?.user_id,
                    isSubscribed: false,
                    subscription_id: subscription_id,
                    isTrial: false,
                    plan_type_id: sub?.plan_type_id,
                    subscription_start: sub?.subscription_start,
                    subscription_end: sub?.subscription_end,
                    cancel_request: true,
                    cancel_at: getisotime(DateTime)
                }
            )
            //current plan status cancel
            await subscription.findOneAndUpdate({
                user_id: sub?.user_id,
            }, {
                isSubscribed: false,
                isTrial: false,
                cancel_request: true,
                cancel_at: getisotime(DateTime)
            })
        }

        const result = await stripe.subscriptions.retrieve(
            subscription_id
        );
        return res.status(200).json({ message: "Subsciption Canceled !!", subscription: result, plan: planData });
    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong :" + error.message });
    }
}

//cancel subscription 
export const renewSubscription: RequestHandler = async (req, res) => {
    const { subscription_id } = req.body;
    if (!subscription_id) {
        return res.status(400).json({ message: "Subsciption  id is required !!" });
    }
    try {
        return res.status(200).json({ message: "Renewed Plan !!", data: subscription });
    } catch (error: any) {
        return res.status(500).json({ message: "Something went wrong" + error.message });
    }
}

export const getCurentPlan: RequestHandler = async (req, res) => {
    const { user_id } = req.body
    try {
        const user_subscription = await subscriptionModel.findOne({ user_id: user_id })
        return res.status(200).json({ message: "My Plan :", data: user_subscription });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}