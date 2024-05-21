import { } from "dotenv/config";
import subscriptionModel from "../../model/subscription/subscription";
import generatepaypaltoken from "../../utils/paypaltoken";
import { RequestHandler } from "express"
import subscriptionHistory from "../../model/subscription/subscriptionHistory";
import { json } from "body-parser";
import { resolve } from "node:path/posix";
import paymentTransactionModel from "../../model/payment/paymentTransaction";
import getisotime from "../../utils/time";
import { DateTime } from "luxon";

// var fetch = require('node-fetch');

export const plansubscription: RequestHandler = async (req, res) => {
    let { user, plan_id } = req.body
    try {

        let subscription_doc = await subscriptionModel.findOne({
            user_id: user._id,
        });

        if (subscription_doc?.interval == "Yearly" && subscription_doc?.isSubscribed) {
            return res.status(400).json({ message: 'You have already yearly plan. You can not take monthly plan before end yearly plan.' })

        }
        let updatesubs = async (data: any) => {
            let old_doc = await subscriptionModel.findOne({
                user_id: user._id,
            });
            let cust: any = await subscriptionModel.findOneAndUpdate(
                { user_id: user._id },
                { subscription_id: data.id, subscription_method: 28 },

                { new: true }
            );
        };


        let paypaltoken = await generatepaypaltoken();

        console.log(paypaltoken, "_____________________");

        if (paypaltoken) {
            let plansubs = fetch(
                "https://api-m.sandbox.paypal.com/v1/billing/subscriptions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${paypaltoken}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        plan_id: plan_id,
                        subscriber: {
                            name: { given_name: user.name },
                            email_address: user.email,
                            shipping_address: {
                                name: { full_name: `${user.name} ` },
                                address: {
                                    address_line_1: user.address,
                                    admin_area_1: user.state,
                                    country_code: user.country_code,
                                },
                            },
                        },
                        application_context: {
                            locale: "en-US",
                            shipping_preference: "SET_PROVIDED_ADDRESS",
                            user_action: "SUBSCRIBE_NOW",
                            payment_method: {
                                payer_selected: "PAYPAL",
                                payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
                            },
                            return_url: `${process.env.URL}paymentsuccess`,
                            cancel_url: `${process.env.URL}paymentfailed`,
                        },
                    }),
                }
            )
                .then((res) => res.text())
                .then((result) => {
                    let resdata: any = JSON.parse(result);
                    updatesubs(resdata);
                    console.log(resdata, "_________");

                    res.status(200).json({ resdata });
                })
                .catch((err) => {
                    res.status(400).json({ message: "Something went wrong" + err });
                });
        }
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
};


export const getsubscriptiondetails: RequestHandler = async (req, res) => {
    let { subscriptionID } = req.body
    try {
        //   let paypaltoken = await generatepaypaltoken();
        let response = await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionID}`, {

            method: "POST",
            headers: {
                //   Authorization: `Bearer ${paypaltoken}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ plan_id: "P-34U58637MH347005SMYWI6IY" }),
        })
            // .then(res => res.text())
            .then(result => {
                let resdata: any = result
                res.status(200).json({ resdata })
                // res.status(200).json({ message: "Subscription details", resdata });
            }).catch(err => {
                res.status(400).json({ message: "Something went wrong" + err });
            });

    } catch (error) {
        res.status(404).json({ message: "Something went wrong" + error });
    }
}

export const cancelsubscription: RequestHandler = async (req, res) => {
    const { subscription_id } = req.body;
    console.log(subscription_id, "_______________");

    let date = getisotime(DateTime)
    try {
        let paypaltoken = await generatepaypaltoken();
        if (paypaltoken) {
            console.log(subscription_id, "_______________22");

            let resp = fetch(
                `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscription_id}/cancel`,

                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${paypaltoken}`,
                        "Content-Type": "application/json",
                        // Accept: "application/json",
                    },
                    body: JSON.stringify({ reason: "Subscription cancel" }),
                }
            )

        }

        // let custs: any = await subscriptionModel.findOneAndUpdate(
        //     { subscription_id: subscription_id },
        //     { isSubscribed: false, subscription_end: date, isTrial: false, cancel_request: true },
        //     { new: true }
        // );

        // let { _id: id, ...modifydataa } = custs._doc;

        // let subslog = await subscriptionHistory.findOneAndUpdate({ subscription_id: subscription_id }, {
        //     ...modifydataa,
        // });

        res.status(200).json({
            message: "Subscription cancelled successfully"

        });
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error });
    }
};

