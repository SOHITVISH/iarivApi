import { RequestHandler } from "express";
import tourExploreCategory from "../../model/tourExploreStatusType/tourExploreCategoryModel";
import getisotime from "../../utils/time";
import { DateTime } from "luxon";
import tourModel from "../../model/tour/tourModel";
import categoryModel from "../../model/tour/categoryModel";
import tourSceneModel from "../../model/tour/tourSceneModel";
import { AnyAaaaRecord } from "dns";




export const tourExploreStatusType: RequestHandler = async (req, res) => {
    let { tour_explore_status_type_id, tour_explore_status_type_name } = req.body
    let date = getisotime(DateTime)
    try {

        let doc = await tourExploreCategory.create({
            tour_explore_status_type_id,
            tour_explore_status_type_name,
            created_at: date,
            updated_at: date
        })

        res.status(200).json({ message: "Tour explore category status type configured !!", result: doc })

    } catch (error: any) {
        return res.status(500).json({ message: error.message })
    }
}
export const getTourExploreStatusType: RequestHandler = async (req, res) => {
    try {
        let data = await tourExploreCategory.find({})
        res.status(200).json({ message: "Fetch status successfully", result: data })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export const tourMoveTo: RequestHandler = async (req, res) => {
    let { tour_id, tour_explore_status_type_id } = req.body
    try {
        let data = await tourModel.findById(tour_id)

        if (!data) {
            return res.status(400).json({ message: "Tour doesn't exist" })
        }
        let udoc = await tourModel.findByIdAndUpdate(tour_id, { tour_explore_status_type_id: tour_explore_status_type_id }, { new: true })
        res.status(200).json({ message: `Tour move to ctegoty ${tour_explore_status_type_id} successfully !!` })
    } catch (error: any) {
        return res.status(500).json({ message: error.message })
    }
}

export const tourMoveToUpcomingTours: RequestHandler = async (req, res) => {
    let { tour_id } = req.body
    try {
        let data = await tourModel.findById(tour_id)

        if (!data) {
            return res.status(400).json({ message: "Tour doesn't exist" })
        }
        let udoc = await tourModel.findByIdAndUpdate(tour_id, { tour_explore_status_type_id: 2 }, { new: true })
        res.status(200).json({ message: "Tour move to upcomming category successfully !!" })
    } catch (error: any) {
        return res.status(500).json({ message: error.message })
    }
}

export const getExploreTour: RequestHandler = async (req, res) => {
    let { tour_explore_status_type_id } = req.body


    const resultsPerPage = 8;

    const pages: number = parseInt(req.params.page);
    let page = pages >= 1 ? pages : 1;
    page = page - 1
    try {

        let data: any = []
        let result = await tourModel.find({ tour_explore_status_type_id, status: 4 }).sort({ createdAt: -1, _id: -1 }).limit(resultsPerPage).skip(resultsPerPage * page);
        let resultCount = await tourModel.find({ tour_explore_status_type_id, status: 4 }).countDocuments()
        if (result.length) {
            for (let index = 0; index < result.length; index++) {
                const element = result[index];
                const category = element.category;
                let tourcategory = await categoryModel.findOne({ _id: category })
                const tour_id = element._id;

                let categoryname = tourcategory?.name
                let scendata = await tourSceneModel.findOne({ tour: tour_id, priority: 1, status: 18 })


                let thumb = scendata?.thumbscene

                data.push({ ...element._doc, categoryname, sceneThumb: thumb })

            }


            return res.status(200).json({ message: `Explore tour category ${tour_explore_status_type_id} fetch successfully`, data, resultCount })

        } else {
            return res.status(200).json({ message: `No tour found for category ${tour_explore_status_type_id} !!`, data })
        }

    } catch (error: any) {
        return res.status(500).json({ message: error.message })
    }
}

