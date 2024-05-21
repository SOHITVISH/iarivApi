import { DateTime } from "luxon"
import tourModel from "../../model/tour/tourModel"
import categoryModel from "../../model/tour/categoryModel"
import getisotime from "../../utils/time"
import jwt from "jsonwebtoken"
import { log } from "../../index";
import { RequestHandler } from "express"
import tourSceneModel from "../../model/tour/tourSceneModel"
import sharper from 'sharp';
import path from "path"
import { UploadedFile } from "../../types/type"
import linkageModel from "../../model/tour/linkageModel"
import infoSpotModel from "../../model/tour/infoSpotModel"
import cameraPositionModel from "../../model/tour/cameraPosition"
import customLogoModel from "../../model/tour/customLogoModel"
import panoModel from "../../model/tour/panoModel"
import planDescriptionModel from "../../model/payment/planDescription"
import paymentPlanModel from "../../model/payment/paymentPlan"
import tourInteractionModel from "../../model/tour/tourInteractionsModel"
import avatarModel from "../../model/tour/avatarModel"
import { S3 } from "@aws-sdk/client-s3"
import subscriptionModel from "../../model/subscription/subscription"
import tourLogModel from "../../model/log/tour/tourLogModel"
import userModel from "../../model/user/userModel"
import userProfileModel from "../../model/user/userProfileModel"




// create tour api
export const createtour: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const { name, description, category, user_id, latitude, longitude, location_name } = req.body;
        if (!name || !description || !category || !user_id || !latitude || !longitude) {
            res.status(400).json({ message: "Please fill name, description, category, user id, latitude, and longitude" })
        }
        const subscription_info = await subscriptionModel.findOne({ user_id: user_id })
        if (subscription_info?.isTrial) {
            const tours_count = await tourModel.find({ user_id: user_id, status: { $ne: 5 } }).countDocuments();
            if (tours_count >= 1) {
                return res.status(400).json({ message: "Please upgrade your account to create more tours." })
            }
        }

        if (subscription_info?.isSubscribed) {
            const tours_count = await tourModel.find({
                user_id: user_id, status: { $ne: 5 }, created_at: {
                    $gte: new Date(subscription_info.subscription_start),// condition for check only current plan limits
                    $lt: new Date(subscription_info.subscription_end)
                }
            }).countDocuments();
            let plan = await paymentPlanModel.findById(subscription_info.plan_type_id)
            if (plan) {
                if (tours_count >= plan.tour_limit) {
                    return res.status(400).json({ message: "Please upgrade your account to create more tours." })
                }
            }
        }
        const result = await tourModel.create({
            name,
            description,
            location_coords: { type: "Point", coordinates: [longitude, latitude] },
            location_name: location_name,
            category,
            user_id,
        });

        await tourInteractionModel.create({
            tour_id: result._id,
            likes: [],
            comments: [],
            view_by: []
        })

        let { _id, ...modifydata } = result._doc

        let tourlog = await tourLogModel.create({
            tour_id: result._id,
            ...modifydata
        })

        const tour = result._id;
        log.info(`Tour Created successfully !!`)
        res.status(200).json({ message: "Tour Created successfully !!", data: tour })


    } catch (error: any) {
        log.error(`Tour create failed  ${error}`)
        return res.status(500).json({ message: error.message })

    }
}

// edit tour 
export const editTour: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const { id, name, description, category, user_id, latitude, longitude, location_name } = req.body;

        let date = getisotime(DateTime);

        if (id) {
            const result = await tourModel.findByIdAndUpdate(id, {
                name: name,
                location_coords: { type: "Point", coordinates: [longitude, latitude] },
                location_name: location_name,
                description: description,
                user_id: user_id,
                category: category,
                updated_at: date
            }, { new: true })


            if (result) {
                let { _id, ...modifydata } = result._doc

                let tourlog = await tourLogModel.create({
                    tour_id: result._id,
                    ...modifydata
                })

            }
            if (result) {
                log.info(`Tour Updated successfully !!`)
                return res.status(200).json({ message: "Tour Updated Succesfully !!", data: result })
            } else {
                return res.status(400).json({ message: "Tour not found !!" })
            }
        } else {
            return res.status(400).json({ message: "Please provide tour id !!" })
        }


    } catch (err: any) {
        log.error(`Tour Updated failed !! ${err}`)
        return res.status(500).json({ message: err.message })
    }

}

// upload tour scene on creation of tour api
export const uploadScenes: RequestHandler = async (req, res) => {

    try {
        console.log("upload scenes", req.body);

        // upload scenes

        const files: UploadedFile[] = req.files as UploadedFile[];
        if (!files.length) {
            return res.status(400).json({ message: "Please upload tour scenes." })
        }


        // validation code for limit
        const subscription_info = await subscriptionModel.findOne({ user_id: req.body.user_id })
        if (subscription_info?.isTrial) {
            const count_scenes = await tourSceneModel.find({ tour: req.body.tour_id, status: 18 }).countDocuments()
            if ((count_scenes + files.length) > 5) {
                return res.status(400).json({ message: "Please upgrade your account to add more scenes. Max scenes for free trial is 5" })
            }
        }

        if (subscription_info?.isSubscribed) {
            const count_scenes = await tourSceneModel.find({
                tour: req.body.tour_id, status: 18, created_at: {
                    $gte: new Date(subscription_info.subscription_start),// condition for check only current plan limits
                    $lt: new Date(subscription_info.subscription_end)
                }
            }).countDocuments()
            let plan = await paymentPlanModel.findById(subscription_info.plan_type_id)
            if (plan) {
                if ((count_scenes + files.length) > plan.tour_scenes_limit) {

                    return res.status(400).json({ message: "Please upgrade your account to create more tours." })
                }
            }
        }



        // Compress the image using a library like sharp or imagemin
        const fs = require('fs');
        let tourpath = "user-" + req.body.user_id + "/tour-" + req.body.tour_id + "/scenes/compressed/";
        const imagePathCom = path.resolve(__dirname, '../../../images/tours/' + tourpath);
        if (!fs.existsSync(imagePathCom)) {
            fs.mkdirSync(imagePathCom, { recursive: true });
        }

        let tourthumbpath = "user-" + req.body.user_id + "/tour-" + req.body.tour_id + "/scenes/thumbs/";
        const imagethumbPath = path.resolve(__dirname, '../../../images/tours/' + tourthumbpath);
        if (!fs.existsSync(imagethumbPath)) {
            fs.mkdirSync(imagethumbPath, { recursive: true });
        }




        try {
            for (const file of files) {
                let targetFileSizeBytes: number = 5242880;
                const imageBuffer = fs.readFileSync(file.path);

                let quality = 100;
                let isBig: boolean = false;
                await fs.stat(file.path, function (err: any, stat: any) {
                    if (err) {
                        // handle error
                        console.log(err);
                    } else {
                        let check: number = stat.size;

                        if (check > targetFileSizeBytes) {
                            isBig = true;
                        }
                    }


                });

                // Compress the image with sharp
                let outputBuffer = await sharper(imageBuffer).jpeg({ quality }).toBuffer();
                // While loop to adjust quality until target file size is reached

                if (isBig) {
                    console.log("compressing....");
                    while (outputBuffer.length > targetFileSizeBytes && quality > 1) {
                        quality -= 5; // Reduce quality by 5 units
                        outputBuffer = await sharper(imageBuffer).jpeg({ quality }).toBuffer();
                    }
                }


                const compresscene = `compressed-${Date.now()}.jpg`;
                // Write compressed image to output file
                if (isBig) {
                    fs.writeFileSync(`${imagePathCom}/${compresscene}`, outputBuffer);
                } else {
                    fs.writeFileSync(`${imagePathCom}/${compresscene}`, imageBuffer);
                }

                const thumbscene = `thumb-${Date.now()}.jpg`;
                try {
                    await sharper(file.path)
                        .resize({
                            width: 250,
                            height: 250
                        })
                        .toFile(`${imagethumbPath}/${thumbscene}`);
                } catch (error) {
                    console.log(error);
                }
                let priority: number = 0;

                const max_priority = await tourSceneModel.findOne({ tour: req.body.tour_id, status: { $ne: '19' } }).sort({ priority: -1 })
                let max = max_priority?.priority;
                if (max) {
                    if (max > priority) {
                        priority = max;
                    }
                }

                await tourSceneModel.create({
                    title: "Scene Title-" + (priority + 1),
                    tour: req.body.tour_id,
                    originalscene: compresscene,
                    thumbscene: thumbscene,
                    priority: (priority + 1)
                });

                console.log(`File saved to database.`);

            }

            log.info(`Scenes has been uploaded Succesfully !!`)
            res.status(200).json({ message: "Scenes has been uploaded Succesfully " })
        } catch (error) {
            console.error("Error saving files to database:", error);
            res.status(500).json({ message: "Error with saving files to database." });
            log.error(`Scenes failed to upload  ${error}`)
        }

    } catch (error: any) {
        log.error(`Faild to upload ${error.message}`)
        return res.status(500).json({ message: `Faild to upload ${error.message}` })
    }
}

// delete large folder with all files
const deleteFolderRecursive = async (folderPath: string) => {
    const fs = require('fs');
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file: any) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) { // Recursive call if it's a directory
                deleteFolderRecursive(curPath);
            } else { // Delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath); // Delete empty directory
        console.log(`Folder ${folderPath} and its contents deleted successfully`);
    } else {
        console.error(`Directory ${folderPath} does not exist.`);
    }
}

// folder deleted
export const deleteLargeFolder: RequestHandler = async (req, res) => {
    let tourpath1 = "user-" + req.body.user_id + "/tour-" + req.body.tour_id + "/scenes/larges/";
    const imagePath = path.resolve(__dirname, '../../../images/tours/' + tourpath1);
    await deleteFolderRecursive(imagePath);
    res.status(200).json({ message: "Folder deleted Succesfully " })
}

// get tour all scenes
export const getTourScenes: RequestHandler = async (req, res) => {
    const tour_id = req.body.tour_id;
    console.log(req.body);
    if (!tour_id) {
        res.status(400).json({ message: "Tour id is reqired !!" });
    }
    try {
        if (tour_id) {
            let scendata = await tourSceneModel.find({ tour: tour_id, status: 18 }).sort({ priority: 1 })
            res.status(200).json({ message: "Tour scenes fetch Succesfully !!", data: scendata })
        }
    } catch (error: any) {
        res.status(500).json({ message: "Something went wrong !!" });
    }
}

// delete scene
export const deleteScene: RequestHandler = async (req, res) => {
    const id = req.body.id;
    const tour = req.body.tour_id;
    if (!id) {
        return res.status(400).json({ message: "Scene id is reqired !!" });
    }
    try {
        let sceneCount = 0;
        sceneCount = await tourSceneModel.find({ tour: tour, status: 18 }).countDocuments()
        if (sceneCount <= 1) {
            return res.status(400).json({ message: "At least one scene is required." })
        }

        let scendata = await tourSceneModel.findByIdAndUpdate(id, { status: 19 }, { new: true })
        let deletedScenePriority: number | undefined = scendata?.priority;
        const scenes = await tourSceneModel.find({ priority: { $gt: deletedScenePriority }, status: 18, tour: tour })
        if (deletedScenePriority) {
            let index: number = deletedScenePriority;
            scenes.map(async (scene) => {
                await tourSceneModel.findByIdAndUpdate(scene._id, { priority: index, title: `Scene Title - ${index++}` })
            })
        }

        log.info(`Tour scenes deleted Succesfully !!`)
        res.status(200).json({ message: "Tour scenes deleted Succesfully !!", data: scendata })
    } catch (error: any) {
        log.error(`Tour scenes deleted failed ${error.message}`)
        res.status(500).json({ message: "Something went wrong !!" });
    }
}

export const restoreScene: RequestHandler = async (req, res) => {
    const id = req.body.id;
    if (!id) {
        res.status(400).json({ message: "Sscene id is reqired !!" });
    }
    try {
        if (id) {
            let scendata = await tourSceneModel.findByIdAndUpdate(id, { status: 18 }, { new: true })
            log.info(`Tour scenes restore Succesfully !!`)
            res.status(200).json({ message: "Tour scenes restore Succesfully !!", data: scendata })
        }
    } catch (error: any) {
        log.error(`Tour scenes restore failed ${error.message}`)
        res.status(500).json({ message: "Something went wrong !!" });
    }
}
// get all tour api
export const getTour: RequestHandler = async (req, res) => {
    try {
        let result: any = [];
        console.log(req.body);
        if (req.body.status && req.body.user_id) {
            const tours = await tourModel.find({ status: req.body.status, user_id: req.body.user_id }).sort({ createdAt: -1, _id: -1 });
            for (let index = 0; index < tours.length; index++) {
                const element = tours[index];
                const tour_id = element._id;
                let scendata = await tourSceneModel.findOne({ tour: tour_id, status: 18 })
                result.push({ tourData: element, sceneData: scendata })
            }
            return res.status(200).json({ message: "Tour fetch Succesfully !!", data: result })
        } else {
            return res.status(400).json({ message: "Please provide status and user !!" })
        }

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}

//get tours by status
export const getTourByStatus: RequestHandler = async (req, res) => {
    try {
        let result: any = [];
        if (req.body.status) {
            const tours = await tourModel.find({ status: req.body.status }).sort({ createdAt: -1, _id: -1 });
            for (let index = 0; index < tours.length; index++) {
                const element = tours[index];
                const tour_id = element._id;
                let scendata = await tourSceneModel.find({ tour: tour_id, status: 18 })
                result.push({ tourData: element, sceneData: scendata })
            }
            return res.status(200).json({ message: "Tours fetch Succesfully !!", data: result })
        } else {
            return res.status(400).json({ message: "Please provide tour status!!" })
        }

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}

// get all tours of single user and by status also
export const getUserTours: RequestHandler = async (req, res) => {
    const { user_id, status } = req.body;
    try {
        let result: any = [];
        let tours = await tourModel.find({ user_id })
        if (status) {
            tours = await tourModel.find({ user_id, status })
        }

        for (let index = 0; index < tours.length; index++) {
            const element = tours[index];
            const tour_id = element._id;
            let scendata = await tourSceneModel.find({ tour: tour_id, status: 18 })
            result.push({ tourData: element, sceneData: scendata })
        }

        return res.status(200).json({ message: "Tour fetch successfully !!", data: result })
    } catch (error: any) {
        return res.status(500).json({ message: error.message })
    }
}

// update tour status
export const updateTourStatus: RequestHandler = async (req, res) => {
    const { id, status } = req.body;
    if (!id || !status) {
        return res.status(400).json({ message: "please provide tour id and status !!" })
    }
    try {
        const result = await tourModel.findByIdAndUpdate(id, { status: status }, { new: true })
        return res.status(200).json({ message: "Tour status updated successfully!!", data: result })
    } catch (error: any) {
        return res.status(500).json({ message: error.message })
    }
}

// get all puiblished tour
export const getPublishedTour: RequestHandler = async (req, res) => {
    try {
        // let result: any = [];
        const result = await tourModel.find({ status: 4 });
        // for (let index = 0; index < tours.length; index++) {
        //     const element = tours[index];
        //     const tour_id = element._id;
        //     let scendata = await tourSceneModel.findOne({ tour: tour_id })
        //     result.push({ tourData: element, sceneData: scendata })
        // }
        return res.status(200).json({ message: "Published tour get Successufully !!", data: result });
    } catch (error: any) {
        return res.status(500).json({ message: error.message })
    }
}

// delete tour api
export const deleteTour: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        if (req.body.tour_id) {
            const tour = await tourModel.findByIdAndUpdate(req.body.tour_id, { status: 5 }, { new: true });

            if (tour) {
                let { _id, ...modifydata } = tour._doc

                let tourlog = await tourLogModel.create({
                    tour_id: tour._id,
                    ...modifydata
                })
            }

            log.info(`Tour deleted Succesfully !!`)
            return res.status(200).json({ message: "Tour deleted Succesfully !!", data: tour })
        } else {
            return res.status(400).json({ message: "Please provide tour id !!" })
        }

    } catch (err: any) {
        log.error(`Tour delete failed ${err.message}`)
        return res.status(500).json({ message: err.message })
    }

}

export const restoreTour: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        if (req.body.tour_id) {
            const tour = await tourModel.findByIdAndUpdate(req.body.tour_id, { status: 2 }, { new: true });

            if (tour) {
                let { _id, ...modifydata } = tour._doc

                let tourlog = await tourLogModel.create({
                    tour_id: tour._id,
                    ...modifydata
                })
            }
            log.info(`Tour restore Succesfully !!`)
            return res.status(200).json({ message: "Tour restore Succesfully !!", data: tour })
        } else {
            return res.status(400).json({ message: "Please provide tour id !!" })
        }

    } catch (err: any) {
        log.error(`Tour restore failed ${err.message}`)
        return res.status(500).json({ message: err.message })
    }

}

// add linkage to the scene 
export const addLinkage: RequestHandler = async (req, res) => {
    try {

        console.log(req.body);
        const { tour_id, scene_id, x_axis, y_axis, z_axis, link_to, icon } = req.body;
        if (!tour_id || !scene_id || !x_axis || !y_axis || !z_axis) {
            return res.status(400).json({ message: "All fields are reqired  !!" })
        }

        const result = await linkageModel.create({
            tour_id,
            scene_id,
            link_to,
            x_axis,
            y_axis,
            z_axis,
            icon
        });

        log.info(`Linkage added succesfully`)
        return res.status(200).json({ message: "Linkage added Succesfully !!", data: result })

    } catch (err: any) {
        log.error(`linkage added failed ${err.message}`)
        return res.status(500).json({ message: err.message })
    }

}

// edit linkage to the scene 
export const editLinkage: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const { x_axis, y_axis, z_axis, link_to, icon, id } = req.body;

        let date = getisotime(DateTime);

        if (id) {
            const result = await linkageModel.findByIdAndUpdate(id, {
                x_axis: x_axis,
                y_axis: y_axis,
                z_axis: z_axis,
                link_to: link_to,
                icon: icon,
                updated_at: date
            }, { new: true })
            if (result) {
                log.info(`Linkage Updated Succesfully !!`)
                return res.status(200).json({ message: "Linkage Updated Succesfully !!", data: result })
            } else {
                return res.status(400).json({ message: "Linkage not found !!" })
            }
        } else {
            return res.status(400).json({ message: "Please provide linkage id !!" })
        }


    } catch (err: any) {
        log.error(`Linkage update failed`)
        return res.status(500).json({ message: err.message })
    }

}
// delete linkage api
export const deleteLinkage: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const id = req.body.id;
        if (id) {
            const linkage = await linkageModel.findByIdAndUpdate(id, { status: 9 }, { new: true });
            log.info(`Linkage delete succesfully`)
            return res.status(200).json({ message: "Linkage deleted Succesfully !!", data: linkage })
        } else {
            return res.status(400).json({ message: "Please provide linkage id !!" })
        }

    } catch (err: any) {
        log.error(`Linkage delete failed ${err.message}`)
        return res.status(500).json({ message: err.message })
    }

}

// get linkage
export const getLinkages: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        let result: any = [];
        const { tour_id, scene_id } = req.body;

        if (!tour_id || !scene_id) {
            return res.status(400).json({ message: "All fields are reqired  !!" })
        }

        const linkages = await linkageModel.find({ tour_id: tour_id, scene_id: scene_id, status: { $ne: '9' } }).populate("icon");

        for (let index = 0; index < linkages.length; index++) {
            const element = linkages[index];
            const link_to = element.link_to;
            // get only those scene link to not deleted
            let scendata = await tourSceneModel.findOne({ _id: link_to, status: 18 });
            if (scendata) {
                result.push({ ...element._doc, scene_title: scendata.title, scene_priority: scendata.priority, min_zoom: scendata.min_zoom, max_zoom: scendata.max_zoom })
            }
        }

        return res.status(200).json({ message: "Linkage fetch Succesfully !!", data: result })

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}

// add Infospot to the scene 
export const addInfospot: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const { title, description, tour_id, scene_id, x_axis, y_axis, z_axis, type, video_url, url_title, url, icon } = req.body;

        if (!title || !tour_id || !scene_id || !x_axis || !y_axis || !z_axis) {
            return res.status(400).json({ message: "All fields are reqired  !!" })
        }

        let filename = "";
        if (req.file) {
            filename = req.file.filename;
        }

        const result = await infoSpotModel.create({
            title,
            icon,
            description,
            tour_id,
            scene_id,
            x_axis,
            y_axis,
            z_axis,
            type,
            video_url,
            url_title,
            url,
            image: filename
        });

        log.info(`Infospot added succesfully`)
        return res.status(200).json({ message: "Infospot added Succesfully !!", data: result })

    } catch (err: any) {
        log.error(`Infospot added failed ${err.message}`)
        return res.status(500).json({ message: err.message })
    }

}

// edit infospot to the scene 
export const editInfospot: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const { title, description, tour_id, scene_id, x_axis, y_axis, z_axis, type, video_url, url_title, url, id, current_image, icon } = req.body;
        let date = getisotime(DateTime);


        let filename = current_image;
        if (req.file) {
            filename = req.file.filename;
        }

        if (id) {
            const result = await infoSpotModel.findByIdAndUpdate(id, {
                title: title,
                description: type == 12 ? description : "",
                tour_id: tour_id,
                scene_id: scene_id,
                x_axis: x_axis,
                y_axis: y_axis,
                z_axis: z_axis,
                icon,
                type: type,
                video_url: type == 13 ? video_url : "",
                url_title: url_title,
                url: url,
                image: type == 12 ? filename : "",
                updated_at: date
            }, { new: true })
            if (result) {

                log.info(`Infospot update succesfully`)
                return res.status(200).json({ message: "infospot Updated Succesfully !!", data: result })
            } else {
                return res.status(400).json({ message: "infospot not found !!" })
            }
        } else {
            return res.status(400).json({ message: "Please provide infospot id !!" })
        }


    } catch (err: any) {
        log.error(`Infospot update failed ${err.message}`)
        return res.status(500).json({ message: err.message })
    }

}

// delete infospot api
export const deleteInfospot: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const id = req.body.id;
        if (id) {
            const infospot = await infoSpotModel.findByIdAndUpdate(id, { status: 11 }, { new: true });

            log.info(`Infospot deleted succesfully`)
            return res.status(200).json({ message: "infospot deleted Succesfully !!", data: infospot })
        } else {
            return res.status(400).json({ message: "Please provide infospot id !!" })
        }

    } catch (err: any) {
        log.error(`Infospot deleted failed ${err.message}`)
        return res.status(500).json({ message: err.message })
    }

}

// get Infospots
export const getInfospots: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const { tour_id, scene_id } = req.body;
        if (!tour_id || !scene_id) {
            return res.status(400).json({ message: "All fields are reqired  !!" })
        }

        const Infospots = await infoSpotModel.find({ tour_id: tour_id, scene_id: scene_id, status: { $ne: '11' } }).populate('icon');
        return res.status(200).json({ message: "Infospots fetch Succesfully !!", data: Infospots })

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}

// get single tour api
export const getSingleTour: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const tour_id = req.body.tour_id;
        if (tour_id) {
            const tour = await tourModel.findOne({ _id: tour_id });
            const userdata = await userModel.findOne({ _id: tour?.user_id })
            const userprofile = await userProfileModel.findOne({ user_id: userdata?._id })
            const category = await categoryModel.findOne({ _id: tour?.category });
            const tourScenes = await tourSceneModel.find({ tour: tour_id, status: 18 }).sort({ priority: 1 });
            let tourData = { ...tour?._doc, category_name: category?.name }
            const result = { tourData: tourData, tourSceneData: tourScenes, userdata: userdata, userprofile: userprofile };
            return res.status(200).json({ message: "Tour fetch Succesfully !!", data: result })
        } else {
            return res.status(400).json({ message: "Please provide tour id !!" })
        }

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}

//update tour thumb

export const updateThumb: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const tour_id = req.body.tour_id;
        let thumbname = "";
        if (req.file) {
            thumbname = req.file.filename;
        }
        if (tour_id) {
            const result = await tourModel.findByIdAndUpdate(tour_id, { thumb: thumbname });
            return res.status(200).json({ message: "Tour thum  updated Succesfully !!", data: result })
        } else {
            return res.status(400).json({ message: "Please provide tour id !!" })
        }

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}

// create category api
export const createcategory: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        let name = req.body.name;
        let id = req.body.id;

        if (id) {
            let result = await categoryModel.findByIdAndUpdate(id, { name }, { new: true })
            return res.status(200).json({ message: "Edit Category Succesfully ", data: result })
        }
        const result = await categoryModel.create({
            name,
        });
        res.status(200).json({ message: "Created Category Succesfully ", data: result })
    } catch (err: any) {
        let errMsg;

        if (err.code === 11000) {
            errMsg = Object.values(err.keyValue)[0] + " already exists."
        } else {
            let name = Object.keys(err.errors)[0]
            errMsg = err.errors[`${name}`].message
        }

        return res.status(500).json({ message: errMsg })
    }

}

// get category for edit
export const getSingleCategory: RequestHandler = async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: "category id require !!" })
    }
    try {
        const result = await categoryModel.findById(id)
        return res.status(200).json({ message: "category fetch successfully !!", data: result })
    } catch (error: any) {
        return res.status(500).json({ message: error.message })
    }
}

// get category api
export const getCategory: RequestHandler = async (req, res) => {
    try {
        const page: number = parseInt(req.params.page);
        const perPage = 10;
        const skip = (page - 1) * perPage;

        const categories = await categoryModel.find({})
            .skip(skip)
            .limit(perPage)
            .sort({ created_at: -1 });
        const catCount = await categoryModel.find({}).countDocuments();
        res.status(200).json({ message: "Category fetch Successfully !!", data: categories, count: catCount });
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}
// all categories
export const allCategory: RequestHandler = async (req, res) => {
    try {
        const categories = await categoryModel.find({ status: 40 })
        res.status(200).json({ message: "Category fetch Successfully !!", data: categories });
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}
//delete category
export const deleteCategory: RequestHandler = async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: "category id require !!" })
    }
    try {
        const check = await tourModel.find({ category: id, status: { $ne: 5 } })
        if (check.length) {
            return res.status(400).json({ message: "Can not delete this is link to the tour !!" })
        }
        const result = await categoryModel.findByIdAndUpdate(id, { status: 41 }, { new: true })
        return res.status(200).json({ message: "category deleted successfully !!", data: result })
    } catch (error: any) {
        return res.status(500).json({ message: error.message })
    }
}


export const restoreCategory: RequestHandler = async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: "category id require !!" })
    }
    try {
        const result = await categoryModel.findByIdAndUpdate(id, { status: 40 }, { new: true })
        return res.status(200).json({ message: "category restore successfully !!", data: result })
    } catch (error: any) {
        return res.status(500).json({ message: error.message })
    }
}
// Set Camera position api
export const setCameraPostion: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const { tour_id, scene_id, h_angle, v_angle, zoom_level, id } = req.body;
        if (!tour_id || !scene_id) {
            return res.status(400).json({ message: "All fields are reqired  !!" })
        }
        if (id) {
            const result = await cameraPositionModel.findByIdAndUpdate(id, {
                tour_id,
                scene_id,
                zoom_level,
                h_angle,
                v_angle,
            }, { new: true });
            return res.status(200).json({ message: "Camera Position updated Succesfully !!", data: result })

        } else {
            const result = await cameraPositionModel.create({
                tour_id,
                scene_id,
                zoom_level,
                h_angle,
                v_angle,
            });
            return res.status(200).json({ message: "Camera Position added Succesfully !!", data: result })
        }

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}
// get Camera Position
export const getCameraPostion: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const scene_id = req.body.scene_id;
        const tour_id = req.body.tour_id;
        if (scene_id && tour_id) {
            const result = await cameraPositionModel.findOne({ tour_id: tour_id, scene_id: scene_id });
            return res.status(200).json({ message: "Position fetch Succesfully !!", data: result })
        } else {
            return res.status(400).json({ message: "Please provide scene and tour id !!" })
        }

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}

// add custom logo api
export const setCustomLogo: RequestHandler = async (req, res) => {

    try {
        console.log(req.body);
        const { tour_id } = req.body;
        if (!tour_id) {
            return res.status(400).json({ message: "Tour is required  !!" })
        }
        const check = await customLogoModel.findOne({ tour_id: tour_id, status: { $ne: '17' } });
        let result;
        if (check) {
            await customLogoModel.findByIdAndUpdate(check._id, { status: 17 });
            result = await customLogoModel.create({
                tour_id,
                logo: req.file?.filename
            });
        } else {
            result = await customLogoModel.create({
                tour_id,
                logo: req.file?.filename
            });
        }

        return res.status(200).json({ message: "Custom logo added Succesfully !!", data: result })

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}


// delete custom logo api
export const deleteCustomLogo: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const id = req.body.id;
        if (id) {
            const logo = await customLogoModel.findByIdAndUpdate(id, { status: 17 }, { new: true });
            return res.status(200).json({ message: "Custom logo deleted Succesfully !!", data: logo })
        } else {
            return res.status(400).json({ message: "Please provide custom logo id !!" })
        }

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}

// get custom logo
export const getCustomLogo: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const tour_id = req.body.tour_id;
        if (tour_id) {
            const logo = await customLogoModel.findOne({ tour_id: tour_id, status: { $ne: '17' } });
            return res.status(200).json({ message: "Custom logo fetch Succesfully !!", data: logo })
        } else {
            return res.status(400).json({ message: "Please provide custom logo id !!" })
        }

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}

// add pano image api
export const setPano: RequestHandler = async (req, res) => {

    try {
        console.log(req.body);
        const { tour_id, scene_id, x_axis, y_axis, z_axis, scale } = req.body;
        if (!tour_id || !scene_id || !x_axis || !y_axis || !z_axis) {
            return res.status(400).json({ message: "All fields is required  !!" })
        }

        let check = await panoModel.findOne({ tour_id: tour_id, scene_id: scene_id, status: { $ne: '15' } });

        if (check) {
            return res.status(400).json({ message: "Pano already exist !!" })
        }

        let filename = "";
        if (req.file) {
            filename = req.file.filename;
        }

        const result = await panoModel.create({
            tour_id,
            scene_id,
            scale,
            x_axis,
            y_axis,
            z_axis,
            image: filename
        });
        return res.status(200).json({ message: "Pano added Succesfully !!", data: result })

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

}

// edit pano image
export const editPano: RequestHandler = async (req, res) => {

    try {
        const { tour_id, scene_id, x_axis, y_axis, z_axis, scale, id } = req.body;

        const result = await panoModel.findByIdAndUpdate(id, {
            tour_id,
            scene_id,
            scale,
            x_axis,
            y_axis,
            z_axis,
        }, { new: true });


        log.info(`Pano update succesfully`)
        return res.status(200).json({ message: "Pano Updated Succesfully !!", data: result })

    } catch (err: any) {
        log.error(`Pano update failed ${err.message}`)
        return res.status(500).json({ message: err.message })
    }

}

// delete pano api
export const deletePano: RequestHandler = async (req, res) => {
    try {
        const id = req.body.id;
        if (id) {
            const pano = await panoModel.findByIdAndUpdate(id, { status: 15 }, { new: true });

            log.info(`Pano delete succesfully`)
            return res.status(200).json({ message: "Pano deleted Succesfully !!", data: pano })
        } else {
            return res.status(400).json({ message: "Please provide pano id !!" })
        }

    } catch (err: any) {
        log.error(`Pano delete failed ${err.message}`)
        return res.status(500).json({ message: err.message })
    }

}

// get panos
export const getPano: RequestHandler = async (req, res) => {
    try {
        const { tour_id, scene_id } = req.body;

        if (!tour_id || !scene_id) {
            return res.status(400).json({ message: "All fields are reqired  !!" })
        }

        const panos = await panoModel.findOne({ tour_id: tour_id, scene_id: scene_id, status: { $ne: '15' } });
        return res.status(200).json({ message: "Panos fetch Succesfully !!", data: panos })

    } catch (err: any) {

        return res.status(500).json({ message: err.message })
    }

}


// update tour scene api
export const updateScene: RequestHandler = async (req, res) => {
    try {
        const { id, title, min_zoom, max_zoom } = req.body;
        if (id) {
            const scene = await tourSceneModel.findByIdAndUpdate(id, {
                title,
                max_zoom,
                min_zoom
            }, { new: true });

            log.info(`Tour scene updated succesfully`)
            return res.status(200).json({ message: "Tour scene updated Succesfully !!", data: scene })
        } else {
            return res.status(400).json({ message: "Please provide scene id !!" })
        }

    } catch (err: any) {
        log.error(`Tour scene updated failed`)
        return res.status(500).json({ message: err.message })
    }

}

// update tour scene api
export const setPriority: RequestHandler = async (req, res) => {
    try {
        let scenes = req.body.scenes_priority;
        for (const val of scenes) {
            console.log(val.id + "---" + val.priority);
            await tourSceneModel.findByIdAndUpdate(val.id, {
                priority: val.priority,
            });
        }
        log.info(`Tour scene priority updated Succesfully !!`)
        return res.status(200).json({ message: "Tour scene priority updated Succesfully !!" })
    } catch (err: any) {
        log.error(`Tour scene priority updated failed !!`)
        return res.status(500).json({ message: err.message })

    }

}





export const likeTour: RequestHandler = async (req, res) => {
    let { tour_id, user_id } = req.body;

    let date = getisotime(DateTime)
    try {

        let tour = await tourModel.findById(tour_id)

        if (!tour) {
            return res.status(400).json({ message: "Tour not found !!" })
        }


        // let tourdoc = await tourInteractionModel.create({
        //     tour_id,
        //     likes: [],
        //     comments: [],
        //     view_by: []
        // })

        let check = await tourInteractionModel.findOne({ "likes.user_id": user_id })

        if (check) {
            await tourInteractionModel.findOneAndUpdate({ "likes.user_id": user_id }, { "$set": { "likes.$.isTourLiked": "true", "likes.$.liked_at": date } }, { new: true })
            return res.json({ message: "Tour likedddd" })
        }
        let liketour = await tourInteractionModel.findOneAndUpdate({ tour_id }, { $push: { likes: { isTourLiked: true, user_id: user_id, liked_at: date } } }, { new: true })
        log.info(`Tour liked Succesfully !!`)
        res.json({ message: "Tour liked" });
    } catch (err) {
        console.error('Error liking post:', err);
        res.status(500).json({ error: 'Internal server error' });
        log.error(`Tour liked failed !!`)
    }
}
export const unlikeTour: RequestHandler = async (req, res) => {
    let { tour_id, user_id } = req.body;

    let date = getisotime(DateTime)
    try {

        let tour = await tourModel.findById(tour_id)

        if (!tour) {
            return res.status(400).json({ message: "Tour not found !!" })
        }
        let liketour = await tourInteractionModel.findOneAndUpdate({ "likes.user_id": user_id }, { "$set": { "likes.$.isTourLiked": "false", "likes.$.unliked_at": date } }, { new: true })
        log.info(`Tour unliked Succesfully !!`)
        res.json({ message: "Tour unliked" });
    } catch (err) {
        console.error('Error liking post:', err);
        res.status(500).json({ error: 'Internal server error' });
        log.error(`Tour unliked failed !!`)
    }
}

export const viewTour: RequestHandler = async (req, res) => {
    let { tour_id,user_id="" } = req.body;

    let date = getisotime(DateTime)
    try {

        let user_ip = req.ip


        let tour = await tourModel.findById(tour_id)

        if (!tour) {
            return res.status(400).json({ message: "Tour not found !!" })
        }


        // let tourdoc = await tourInteractionModel.create({
        //     tour_id,
        //     likes: [],
        //     comments: [],
        //     view_by: []
        // })

        // let check = await tourInteractionModel.findOne({ "view_by.user_id": user_id })

        // if (check) {
        //     await tourInteractionModel.findOneAndUpdate({ "likes.user_id": user_id }, { "$set": { "view_by.$.view_at": date } }, { new: true })
        //     return res.json({ message: "Tour viewed" })
        // }
        let viewtour = await tourInteractionModel.findOneAndUpdate({ tour_id }, { $push: { view_by: { user_id: user_id, user_ip_address: user_ip, view_at: date } } }, { new: true })
        log.info(`Tour viewed Succesfully !!`)
        res.json({ message: "Tour viewd" });
    } catch (err) {
        console.error('Error liking post:', err);
        res.status(500).json({ error: 'Internal server error' });
        log.error(`Tour viewed failed !!`)
    }

}

export const commentsTour: RequestHandler = async (req, res) => {
    let { tour_id, user_id, comment } = req.body;
    let date = getisotime(DateTime)
    try {

        let tour = await tourModel.findById(tour_id)

        if (!tour) {
            return res.status(400).json({ message: "Tour not found !!" })
        }

        let liketour = await tourInteractionModel.findOneAndUpdate({ tour_id }, { $push: { comments: { comment: comment, user_id: user_id, comment_at: date } } }, { new: true })
        log.info(`Tour - commented Succesfully !!`)
        res.json({ message: "Comment succesfully" });
    } catch (err) {
        console.error('Error liking post:', err);
        res.status(500).json({ error: 'Internal server error' });
        log.error(`Tour - commented failed !!`)
    }

}

export const editcomment: RequestHandler = async (req, res) => {
    let { tour_id, id, comment } = req.body;
    let date = getisotime(DateTime)
    try {

        let tour = await tourModel.findById(tour_id)

        if (!tour) {
            return res.status(400).json({ message: "Tour not found !!" })
        }

        await tourInteractionModel.findOneAndUpdate({ "comments._id": id }, { "$set": { "comments.$.comment": comment, "comments.$.updated_at": date } }, { new: true })

        log.info(`TourEdit - commented Succesfully !!`)
        res.json({ message: "Comment succesfully" });
    } catch (err) {
        console.error('Error liking post:', err);
        res.status(500).json({ error: 'Internal server error' });
        log.error(`TourEdit - commented failed !!`)
    }
}

// setup avatar
export const setAvatar: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const { tour_id, scene_id, avatar, speech_type, avatar_speech_text, x_axis, y_axis } = req.body;

        let filename = "";
        if (req.file) {
            filename = req.file.filename;
        }

        const result = await avatarModel.create({
            tour_id,
            scene_id,
            speech_type,
            avatar,
            avatar_speech_text,
            avatar_speech_audio: filename,
            x_axis,
            y_axis
        });
        return res.status(200).json({ message: "Avatar Added Successufully !!", data: result });


    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}

// edit avatar
export const editAvatar: RequestHandler = async (req, res) => {
    try {
        console.log(req.body);
        const { id, tour_id, scene_id, avatar, avatar_speech_text, speech_type, x_axis, y_axis, current_audio } = req.body;

        let filename = current_audio;
        let text = avatar_speech_text;
        if (req.file) {
            filename = req.file.filename;
        }
        if (speech_type == 32) {
            filename = "";
        } else {
            text = ""
        }

        if (id) {
            const result = await avatarModel.findByIdAndUpdate(id, {
                tour_id,
                scene_id,
                speech_type,
                avatar,
                avatar_speech_text: text,
                avatar_speech_audio: filename,
                x_axis,
                y_axis
            }, { new: true });
            return res.status(200).json({ message: "Avatar Updated Successufully !!", data: result });
        } else {
            return res.status(400).json({ message: "Please provide avatar id!!" });
        }
    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}

// get avatar
export const getAvatar: RequestHandler = async (req, res) => {

    try {
        console.log(req.body);
        const { tour_id, scene_id } = req.body;
        const result = await avatarModel.findOne({ tour_id: tour_id, scene_id: scene_id, status: { $ne: '30' } }).populate('avatar')
        return res.status(200).json({ message: "Avatar get Successufully !!", data: result });
    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}

// delete avatar
export const deleteAvatar: RequestHandler = async (req, res) => {

    try {
        const { id } = req.body;
        const result = await avatarModel.findByIdAndUpdate(id, { status: 30 }, { new: true })
        return res.status(200).json({ message: "Avatar deleted Successufully !!", data: result });
    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}

