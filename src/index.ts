import express from 'express'
import connect from './database/database'
import { } from "dotenv/config"
import userRouter from "./routes/route"
import log4js from 'log4js';
import { DateTime } from 'luxon'
import statusType from './model/statusType/statusType'
import cors from "cors"
import expressSession from "express-session"
import MongoStore from 'connect-mongo'
import bodyParser from 'body-parser'
import { engine } from "express-handlebars";
import path from 'path'
import generatepaypaltoken from './utils/paypaltoken';
import { CronJob } from 'cron';
import Stripe from 'stripe';
import subscription from './model/subscription/subscription';
import paymentTransaction from './model/payment/paymentTransaction';
import paymentTransactionModel from './model/payment/paymentTransaction';
import getisotime from './utils/time';
import { checktrialEnd } from './utils/validation';
import paymentPlanModel from './model/payment/paymentPlan';
import subscriptionHistory from './model/subscription/subscriptionHistory';
import subscriptionModel from './model/subscription/subscription';
import userModel from './model/user/userModel';
import { OAuth2Client } from 'google-auth-library'
const app = express();


app.use(bodyParser.urlencoded({ extended: true }))
const viewPath = path.resolve(__dirname, '../view/');
app.engine(
    "handlebars",
    engine({ extname: ".handlebars", defaultLayout: "main" })
);
app.set("view engine", "handlebars");
app.set("views", viewPath);
app.use(express.static("public"));
app.set('trust proxy', 1)



declare module 'express-session' {
    export interface SessionData {
        token: string;
    }
}

// stripe configuration
const STRIPE_SK = process.env.STRIPE_SK || "";
const stripe = new Stripe(STRIPE_SK);

// app.use(cookieParser(process.env.SESSION_SECRET));

// const server = http.create(app);
const PORT = process.env.SERVER_PORT || 8080;


connect();




app.use(
    cors({
        credentials: true,
        // origin: '*',
        // origin: 'http://localhost:3000',
        origin: ['https://staging.iariv.com', 'https://stagingapi.iariv.com', "https://adminstaging.iariv.com", "https://demo.iariv.com", 'https://demoapi.iariv.com', "https://admindemo.iariv.com"],
    })
);


app.post("/api/stripe-webhook", express.raw({ type: "*/*" }), async (req, res) => {
    const sig: any = req.headers['stripe-signature'];
    let event: Stripe.Event | undefined;
    const endpoint: any = process.env.END_POINT_SECRET;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpoint);
    }
    catch (err: any) {
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event) {
        let user;
        let data;
        let lines;
        switch (event.type) {
            case "invoice.paid":
                console.log("invoice.paid", event.data.object)
                data = event.data.object;
                lines = data.lines.data[0]

                let planData = await paymentPlanModel.findOne({ stripe_price_id: lines.plan?.id })
                // cancel prev plan is any
                const preSub = await subscriptionModel.findOne({ stripe_cus_id: data.customer })
                if (preSub) {
                    if (preSub.isSubscribed && preSub.subscription_method == 27) {
                        await stripe.subscriptions.cancel(preSub.subscription_id);
                    }
                    if (preSub.isSubscribed && preSub.subscription_method == 28) {
                        let paypaltoken = await generatepaypaltoken();
                        if (paypaltoken) {
                            await fetch(
                                `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${preSub.subscription_id}/cancel`,

                                {
                                    method: "POST",
                                    headers: {
                                        Authorization: `Bearer ${paypaltoken}`,
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ reason: "Subscription cancel" }),
                                }
                            )

                        }

                    }
                }
                // end
                user = await subscription.findOneAndUpdate({
                    stripe_cus_id: data.customer,
                }, {
                    isSubscribed: true,
                    plan_id: data.id,
                    isTrial: false,
                    cancel_request: false,
                    interval: lines.plan?.interval,
                    subscription_id: lines.subscription,
                    plan_type_id: planData?._id,
                    subscription_method: 27,
                    subscription_start: DateTime.fromSeconds(lines.period.start).toUTC().toISO(),
                    subscription_end: DateTime.fromSeconds(lines.period.end).toUTC().toISO(),
                    next_billing_time: DateTime.fromSeconds(lines.period.end).toUTC().toISO()
                }, { new: true });


                // createing log for subscription
                if (user) {
                    let { _id, ...history } = user._doc
                    await subscriptionHistory.create({
                        ...history,
                    })
                }

                break
            case "customer.subscription.deleted":
                console.log("customer.subscription.deleted")
                data = event.data.object;
                const subscription_id = data.id;
                console.log(subscription_id);

                await subscriptionHistory.findOneAndUpdate(
                    { subscription_id: subscription_id },
                    {
                        isSubscribed: false,
                        subscription_id: subscription_id,
                        isTrial: false,
                        cancel_request: true,
                        cancel_at: getisotime(DateTime)
                    }
                )
                break
            case "payment_intent.succeeded":
                console.log("payment_intent.succeeded", event.data.object)
                data = event.data.object;
                user = await subscription.findOne({
                    stripe_cus_id: data.customer,
                });
                if (user) {

                    await paymentTransactionModel.create({
                        user_id: user.user_id,
                        transaction_id: data.id,
                        transaction_status: 26,
                        amount: Number(data.amount),
                        gateway_type: 27,
                        transaction_message: "Payment Succeeded"
                    });
                }

                break
            case "payment_intent.payment_failed":
                console.log("payment_intent.payment_failed", event.data.object)
                data = event.data.object;
                user = await subscription.findOne({
                    stripe_cus_id: data.customer,
                });
                if (user) {
                    await paymentTransactionModel.create({
                        user_id: user.user_id,
                        transaction_id: data.id,
                        transaction_status: 24,
                        amount: Number(data.amount),
                        gateway_type: 27,
                        transaction_message: data.last_payment_error?.message
                    });
                }
                break
            case "payment_intent.created":
                console.log("payment_intent.created")
                data = event.data.object;
                user = await subscription.findOne({
                    stripe_cus_id: data.customer,
                });
                if (user) {
                    await paymentTransactionModel.create({
                        user_id: user.user_id,
                        transaction_id: data.id,
                        transaction_status: 44,
                        amount: Number(data.amount),
                        gateway_type: 27,
                        transaction_message: "Payment Intent created"
                    });
                }
                break
            case "payment_intent.canceled":
                console.log("payment_intent.canceled")
                data = event.data.object;
                user = await subscription.findOne({
                    stripe_cus_id: data.customer,
                });
                if (user) {
                    await paymentTransactionModel.create({
                        user_id: user.user_id,
                        transaction_id: data.id,
                        transaction_status: 45,
                        amount: Number(data.amount),
                        gateway_type: 27,
                    });
                }
                break
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    }
    return res.status(200).json({ received: true });
})

let exporesJSONConfig: bodyParser.OptionsUrlencoded = { extended: true }
app.use(express.json(exporesJSONConfig));



if (process.env?.SESSION_SECRET) {
    const expressSessionOptions: expressSession.SessionOptions = { secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false, cookie: { secure: true, httpOnly: true, maxAge: 1000 * 60 * 60 }, store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL, collectionName: "user_session" }) }
    app.use(expressSession(expressSessionOptions))
}
app.use("/api", userRouter);

//-------------------------------------------------------------------------log4js configure

log4js.configure({
    appenders: {
        virtual_tour: {
            type: "file",
            filename: `../log/${DateTime.now().toFormat("LLLL dd, yyyy")}-virtual_tour.log`,
        },
    },
    categories: { default: { appenders: ["virtual_tour"], level: "trace" } },
});

export const log = log4js.getLogger("virtual_tour");

//---------------------------------------------------------------log4js configure end here


//---------------------------------------------------------------------Socket.io configure
//-------------------------------------------------------------Socket.io configure end here


//---------------------------------------------------------------------Cron Scheduler
// Cron job sheduler for checking subscription daily at 12:00
const job = new CronJob(
    '0 12 * * *', // cronTime
    async () => {
        await checktrialEnd()
    }, // onTick
    null, // onComplete
    true, // start
    'America/Los_Angeles' // timeZone
);

//---------------------------------------------------------------------End Cron Scheduler


app.get("/api", (req, res) => {
    // req.session.token=1
    res.send("Virtual Tour API");
});


//--------------------------------paypal start from here
app.post("/api/paypalwebhook", async (req, res) => {
    let date = getisotime(DateTime)
    try {
        let event = req.body.event_type;
        let event_obj = req.body;

        let billingupdate = async (obj: any) => {

            let res = await paymentPlanModel.findOne({ paypal_plan_id: obj.plan_id })
            let cust = await subscription.findOneAndUpdate(
                { subscription_id: obj.id },
                {
                    next_billing_time: obj.billing_info.next_billing_time, plan_type_id: res?._id

                },
                { new: true }
            );
        };

        switch (event) {
            case "BILLING.SUBSCRIPTION.ACTIVATED":
                let resource_id = event_obj.resource.id;
                console.log(resource_id, "_________________________resourceID");
                let paypaltokens = await generatepaypaltoken();
                let cust: any
                let subscription_doc = await (await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${resource_id}`, {
                    headers: {
                        // 'X-PAYPAL-SECURITY-CONTEXT': '{"consumer":{"accountNumber":1181198218909172527,"merchantId":"5KW8F2FXKX5HA"},"merchant":{"accountNumber":1659371090107732880,"merchantId":"2J6QB8YJQSJRJ"},"apiCaller":{"clientId":"AdtlNBDhgmQWi2xk6edqJVKklPFyDWxtyKuXuyVT-OgdnnKpAVsbKHgvqHHP","appId":"APP-6DV794347V142302B","payerId":"2J6QB8YJQSJRJ","accountNumber":"1659371090107732880"},"scopes":["https://api-m.paypal.com/v1/subscription/.*","https://uri.paypal.com/services/subscription","openid"]}',
                        Authorization: `Bearer ${paypaltokens}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                })).json();

                let old_doc = await subscription.findOne({
                    subscription_id: resource_id,
                });

                let planID = ""
                if (subscription_doc.plan_id == "P-34U58637MH347005SMYWI6IY") {
                    planID = "Monthly"
                }
                if (subscription_doc.plan_id == "P-3JT86348GB196730VMZBQTOI") {
                    planID = "Yearly"
                }

                // let planType = await paymentPlanModel.findOne({
                //     paypal_plan_id: subscription_doc.plan_id,
                // });

                if (subscription_doc.status) {
                    if (subscription_doc.status == "ACTIVE") {
                        let cycleExecutions = subscription_doc.billing_info.cycle_executions
                        if (cycleExecutions.length) {
                            cust = await subscription.findOneAndUpdate(
                                { subscription_id: resource_id },
                                {
                                    isSubscribed: true,
                                    isTrial: false,
                                    // trial_start: subscription_doc.start_time,
                                    // trial_end: subscription_doc.billing_info.next_billing_time,
                                    cancel_request: false,
                                    subscription_start: subscription_doc.start_time,
                                    next_billing_time: subscription_doc.billing_info.next_billing_time,
                                    subscription_end: subscription_doc.billing_info.next_billing_time,
                                    plan_id: subscription_doc.plan_id,
                                    plan_name: planID,
                                    interval: planID,
                                    interval_count: 1,
                                    subscription_method: 28,

                                },
                                { new: true }
                            );

                        }

                    }
                }

                // cancel prev plan start
                const preSub = await subscriptionHistory.findOne({ user_id: cust?.user_id }).sort({ _id: -1 })
                if (preSub) {
                    if (preSub.isSubscribed && preSub.subscription_method == 28) {
                        let subsID = preSub?.subscription_id
                        if (paypaltokens) {
                            console.log(subsID, "_______________22");

                            await fetch(
                                `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subsID}/cancel`,

                                {
                                    method: "POST",
                                    headers: {
                                        Authorization: `Bearer ${paypaltokens}`,
                                        "Content-Type": "application/json",
                                        // Accept: "application/json",
                                    },
                                    body: JSON.stringify({ reason: "Subscription cancel" }),
                                }
                            )

                        }
                    }
                    if (preSub.isSubscribed && preSub.subscription_method == 27) {
                        let subsID = preSub?.subscription_id
                        await stripe.subscriptions.cancel(subsID);
                    }
                }
                // cancel prev plan end
                let { _id, ...modifydata } = cust._doc;

                let sublog = await subscriptionHistory.create({

                    ...modifydata,

                });
                break;

            case "BILLING.SUBSCRIPTION.CREATED":
                let billingSubscriptionCreated = event_obj
                console.log(event_obj, "____________________subsCreated");
                break;

            case "PAYMENT.SALE.COMPLETED":
                let billingAgreementId = event_obj.resource.billing_agreement_id;

                let result: any = await subscription.findOne({
                    subscription_id: billingAgreementId,
                });


                if (result.isTrial) {
                    await subscription.findOneAndUpdate({ subscription_id: billingAgreementId }, { isTrial: false });
                }

                let paypaltoken = await generatepaypaltoken();
                if (paypaltoken) {
                    fetch(
                        `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${result.subscription_id}`,
                        {
                            headers: {
                                Authorization: `Bearer ${paypaltoken}`,
                                "Content-Type": "application/json",
                                Accept: "application/json",
                            },
                        }
                    )
                        .then((res) => res.text())
                        .then((result) => {
                            let resdata = JSON.parse(result);
                            console.log(result);

                            billingupdate(resdata);
                        })
                        .catch((err) => { });
                }

                let amount = parseInt(event_obj.resource.amount.total) * 100;
                let payment_data = await paymentTransaction.findOne({
                    transaction_id: event_obj.resource.id,
                });

                if (!payment_data) {
                    let res = await paymentTransaction.create({
                        user_id: result.user_id,
                        transaction_id: event_obj.resource.id,
                        transaction_status: 26,
                        amount: amount,
                        gateway_type: 28,
                    });
                }

                break;

            case "BILLING.SUBSCRIPTION.CANCELLED":
                let cancel_billing_id = event_obj.resource.id;
                let old_doc2 = await subscription.findOne({
                    subscription_id: cancel_billing_id,
                });
                let custs: any = await subscription.findOneAndUpdate(
                    { subscription_id: cancel_billing_id },
                    { isSubscribed: false, subscription_end: date, isTrial: false, cancel_request: true, cancel_at: date },
                    { new: true }
                );

                await subscriptionHistory.findOneAndUpdate(
                    { subscription_id: cancel_billing_id },
                    { isSubscribed: false, subscription_end: date, isTrial: false, cancel_request: true, cancel_at: date },
                    { new: true }
                );

                let paymentData = await paymentTransaction.findOneAndUpdate(
                    { transaction_id: event_obj.resource.id },
                    { transaction_status: 45 },
                    { new: true }

                );

                let { _id: id, ...modifydataa } = custs._doc;

                let subslog = await subscriptionHistory.create({
                    ...modifydataa,
                });

                break;

            case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
                let payment_failed_id = event_obj.resource.id;
                let custss: any = await subscription.findOneAndUpdate(
                    { subscription_id: payment_failed_id },
                    { isSubscribed: false, subscription_end: date, isTrial: false },
                    { new: true }
                );
                break;

            case "BILLING.SUBSCRIPTION.SUSPENDED":
                let billing_suspend_id = event_obj.resource.id;
                let old_doc3 = await subscription.findOne({
                    subscription_id: billing_suspend_id,
                });
                let custsdoc: any = await subscription.findOneAndUpdate(
                    { subscription_id: billing_suspend_id },
                    { isSubscribed: false, subscription_end: date, isTrial: false },
                    { new: true }
                );
                let { _id: idp, ...modify } = custsdoc._doc;

                let subsriptionlog = await subscriptionHistory.create({
                    ...modify
                });
                break;

            default:
                console.log(`Unhandled event type ${event}`);
        }

        res.status(200).json({ event });

    } catch (error) {
        console.log(error, "_______________error");
    }
})


app.get("/api/test/paypalsuccess", async (req, res) => {

    let paypaltokens = await generatepaypaltoken();
    let cust
    let subscription_doc: any = await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-4S12VH4KVE18`, {
        headers: {
            // 'X-PAYPAL-SECURITY-CONTEXT': '{"consumer":{"accountNumber":1181198218909172527,"merchantId":"5KW8F2FXKX5HA"},"merchant":{"accountNumber":1659371090107732880,"merchantId":"2J6QB8YJQSJRJ"},"apiCaller":{"clientId":"AdtlNBDhgmQWi2xk6edqJVKklPFyDWxtyKuXuyVT-OgdnnKpAVsbKHgvqHHP","appId":"APP-6DV794347V142302B","payerId":"2J6QB8YJQSJRJ","accountNumber":"1659371090107732880"},"scopes":["https://api-m.paypal.com/v1/subscription/.*","https://uri.paypal.com/services/subscription","openid"]}',
            Authorization: `Bearer ${paypaltokens}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })

        .then((res) => res.text())
        .then((result: any) => {
            let resdata: any = JSON.parse(result);

            console.log(resdata, "___________________");

            res.status(200).json({ resdata });
        })
        .catch((err: any) => {
            res.status(400).json({ message: "Something went wrong" + err });
        });
    // res.render("paypalsuccess")
})
app.get("/api/paypalcancel", async (req, res) => {
    res.render("paypalcancelpayment")
})
//--------------------------------paypal end here


app.get("/api/config/statustype", async (req, res) => {
    await statusType.deleteMany({});
    await statusType.create({ status_type: "USER ACTIVE", status_type_id: 1 });
    await statusType.create({ status_type: "USER REMOVED", status_type_id: -1 });
    await statusType.create({ status_type: "USER BLOCKED", status_type_id: -18 });
    await statusType.create({ status_type: "TOUR DRAFTED", status_type_id: 2 });
    await statusType.create({ status_type: "TOUR SUBMITED", status_type_id: 3 });
    await statusType.create({ status_type: "TOUR PUBLISHED", status_type_id: 4 });
    await statusType.create({ status_type: "TOUR DELETED", status_type_id: 5 });
    await statusType.create({ status_type: "TOUR PRIVATE", status_type_id: 6 });
    await statusType.create({ status_type: "TOUR PUBLIC", status_type_id: 7 });
    await statusType.create({ status_type: "ACTIVE LINKAGE", status_type_id: 8 });
    await statusType.create({ status_type: "INACTIVE LINKAGE", status_type_id: 9 });
    await statusType.create({ status_type: "ACTIVE INFOSPOT", status_type_id: 10 });
    await statusType.create({ status_type: "INACTIVE INFOSPOT", status_type_id: 11 });
    await statusType.create({ status_type: "IMAGE TYPE", status_type_id: 12 });
    await statusType.create({ status_type: "VIDEO TYPE", status_type_id: 13 });
    await statusType.create({ status_type: "ACTIVE PANO", status_type_id: 14 });
    await statusType.create({ status_type: "INACTIVE PANO", status_type_id: 15 });
    await statusType.create({ status_type: "ACTIVE LOGO", status_type_id: 16 });
    await statusType.create({ status_type: "INACTIVE LOGO", status_type_id: 17 });
    await statusType.create({ status_type: "ACTIVE SCENE", status_type_id: 18 });
    await statusType.create({ status_type: "INACTIVE SCENE", status_type_id: 19 });
    await statusType.create({ status_type: "ACTIVE PLAN", status_type_id: 20 });
    await statusType.create({ status_type: "INACTIVE PLAN", status_type_id: 21 });
    await statusType.create({ status_type: "ACTIVE PLAN DESCRIPTION", status_type_id: 22 });
    await statusType.create({ status_type: "INACTIVE PLAN DESCRIPTION", status_type_id: 23 });
    await statusType.create({ status_type: "FAILED", status_type_id: 24 });
    await statusType.create({ status_type: "PENDING", status_type_id: 25 });
    await statusType.create({ status_type: "SUCCEESS", status_type_id: 26 });
    await statusType.create({ status_type: "INITIATE", status_type_id: 44 });
    await statusType.create({ status_type: "CANCEL", status_type_id: 45 });
    await statusType.create({ status_type: "STRIPE", status_type_id: 27 });
    await statusType.create({ status_type: "PAYPAL", status_type_id: 28 });
    await statusType.create({ status_type: "ACTIVE AVATAR", status_type_id: 29 });
    await statusType.create({ status_type: "INACTIVE AVATAR", status_type_id: 30 });
    await statusType.create({ status_type: "AUDIO", status_type_id: 31 });
    await statusType.create({ status_type: "TEXT", status_type_id: 32 });
    await statusType.create({ status_type: "COMMUNITY ANSWER ACTIVE", status_type_id: 33 });
    await statusType.create({ status_type: "COMMUNITY ANSWER DELETE", status_type_id: 34 });
    await statusType.create({ status_type: "COMMUNITY QUESTION ACTIVE", status_type_id: 35 });
    await statusType.create({ status_type: "COMMUNITY QUESTION DELETE", status_type_id: 36 });
    await statusType.create({ status_type: "NEW RELEASE TOUR", status_type_id: 37 });
    await statusType.create({ status_type: "BY VIEW TOUR", status_type_id: 38 });
    await statusType.create({ status_type: "FEATURE TOUR", status_type_id: 39 });
    await statusType.create({ status_type: "ACTIVE CATEGORY", status_type_id: 40 });
    await statusType.create({ status_type: "INACTIVE CATEGORY", status_type_id: 41 });
    await statusType.create({ status_type: "TOUR BLOCK", status_type_id: 42 });
    await statusType.create({ status_type: "TOUR UNBLOCK", status_type_id: 43 });

    await statusType.create({ status_type: "ACTIVE LINKAGE ICON", status_type_id: 52 });
    await statusType.create({ status_type: "INACTIVE LINKAGE ICON", status_type_id: 53 });

    await statusType.create({ status_type: "ADMIN", status_type_id: 50 });
    await statusType.create({ status_type: "USER", status_type_id: 51 });

    await statusType.create({ status_type: "ACTIVE INFOSPOT ICON", status_type_id: 54 });
    await statusType.create({ status_type: "INACTIVE INFOSPOT ICON", status_type_id: 55 });

    await statusType.create({ status_type: "ACTIVE AVATAR", status_type_id: 56 });
    await statusType.create({ status_type: "INACTIVE AVATAR", status_type_id: 57 });
    await statusType.create({ status_type: "GOOGLE SIGNIN", status_type_id: 58 });
    await statusType.create({ status_type: "FACEBOOK SIGNIN", status_type_id: 59 });
    await statusType.create({ status_type: "EMAIL PASSWORD SIGNIN", status_type_id: 60 });




    res.send("Status type configured");
});


// app.post("/check", async (req: any, res: any) => {
//     let { credential } = req.body

//     try {
//         const client = new OAuth2Client();

//         const ticket = await client.verifyIdToken({
//             idToken: credential,
//             audience: process.env.GOOGLE_CLIENT_ID,
//         });

//         console.log(ticket, "___________tic");

//         const payload = ticket.getPayload();
//         console.log(payload, "_______________pay");
//     } catch (error:any) {
//         res.status(400).json({ message: "Something went wrong" + error });
//     }
// })



app.post("/api/backgroundlocation", async (req, res) => {
    let { data } = req.body
    try {
        console.log(data);
        res.status(200).json({ message: "Okay" });
    } catch (error) {
        res.status(400).json({ message: "Something went wrong" + error })
    }
})



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


