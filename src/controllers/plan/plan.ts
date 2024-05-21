import { RequestHandler } from "express";
import paymentPlanModel from "../../model/payment/paymentPlan";
import planDescriptionModel from "../../model/payment/planDescription";



export const addPlanDesc: RequestHandler = async (req, res) => {
    try {
        const { plan_desc, id, plan_id } = req.body;
        if (id) {
            const result = await planDescriptionModel.findByIdAndUpdate(id, {
                plan_id,
                plan_desc,
            }, { new: true });

            return res.status(200).json({ message: "Plan Description Updated Successufully !!", data: result });

        } else {
            const result = await planDescriptionModel.create({
                plan_id,
                plan_desc,
            });

            return res.status(200).json({ message: "Plan Description Added Successufully !!", data: result });
        }

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}

export const getPlanDesc: RequestHandler = async (req, res) => {
    try {
        const { plan_id } = req.body;

        const result = await planDescriptionModel.find({ plan_id: plan_id, plan_status: { $ne: 23 } }).populate('plan_id');

        return res.status(200).json({ message: "Plan Description fetch Successufully !!", data: result });

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}

export const deletePlanDesc: RequestHandler = async (req, res) => {
    try {
        const { plan_desc_id } = req.body;

        const result = await planDescriptionModel.findByIdAndUpdate(plan_desc_id, { plan_status: 23 });

        return res.status(200).json({ message: "Plan Description deleted Successufully !!", data: result });

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}

export const addPlan: RequestHandler = async (req, res) => {
    try {
        const { plan_name, tour_limit, plan_price, id,tour_scenes_limit,paypal_plan_id,stripe_price_id,interval } = req.body;

        if (id) {
            const result = await paymentPlanModel.findByIdAndUpdate(id, {
                plan_name,
                tour_limit,
                plan_price,
                tour_scenes_limit,
                paypal_plan_id,
                stripe_price_id,
                interval
            }, { new: true });
            return res.status(200).json({ message: "Plan Updated Successufully !!", data: result });
        } else {
            const result = await paymentPlanModel.create({
                plan_name,
                tour_limit,
                plan_price,
                tour_scenes_limit,
                paypal_plan_id,
                stripe_price_id,
                interval
            });
            return res.status(200).json({ message: "Plan Added Successufully !!", data: result });
        }

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}

export const getPlan: RequestHandler = async (req, res) => {
    try {

        const result = await paymentPlanModel.find({ plan_status: { $ne: 21 } });

        return res.status(200).json({ message: "Plan fetch Successufully !!", data: result });

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}
export const getPlanAdmin: RequestHandler = async (req, res) => {
    try {

        const result = await paymentPlanModel.find({});

        return res.status(200).json({ message: "Plan fetch Successufully !!", data: result });

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}

export const deletePlan: RequestHandler = async (req, res) => {
    try {
        const { plan_id } = req.body
        const result = await paymentPlanModel.findByIdAndUpdate(plan_id, { plan_status: 21 })

        return res.status(200).json({ mesage: "Plan deleted successfully !!", data: result })

    } catch (error: any) {
        return res.status(500).json({ message: error.mesage })

    }
}

export const restorePlan: RequestHandler = async (req, res) => {
    try {
        const { plan_id } = req.body
        const result = await paymentPlanModel.findByIdAndUpdate(plan_id, { plan_status: 20 })

        return res.status(200).json({ mesage: "Plan restored successfully !!", data: result })

    } catch (error: any) {
        return res.status(500).json({ message: error.mesage })

    }
}
export const getPlanWithDesc: RequestHandler = async (req, res) => {

    try {
        let data: any = [];
        let result = await paymentPlanModel.find({ plan_status: { $ne: 21 } });

        for (let index = 0; index < result.length; index++) {
            const element = result[index];
            const planID = element._id

            let planDesc = await planDescriptionModel.find({ plan_id: planID,plan_status:22 })

            data.push({ ...element._doc,planDesc })

        }

        res.status(200).json({ result: data })

    } catch (error:any) {
        return res.status(400).json({ message: error.message })
    }

}
