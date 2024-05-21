import { RequestHandler } from "express";
import path from "path";
import { DeleteObjectCommand, DeleteObjectCommandOutput, GetObjectCommand, HeadObjectCommand, ListObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import tourModel from "../../model/tour/tourModel";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from 'fs';
import subscriptionModel from "../../model/subscription/subscription";

const accessKey:any = process.env.S3_ACCESS_KEY;
const secKey:any = process.env.S3_SEC_KEY;
const bucketName:any = process.env.S3_BUCKET_NAME;
const region:any = process.env.S3_REGION

const s3Config = new S3Client({
    region: region,
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secKey,
    }
});

export const uploadOnS3: RequestHandler = async (req, res) => {
    try {
        const tour_id = req.body.tour_id;
        const user_id = req.body.user_id;

        if (!tour_id || !user_id) {
            return res.status(400).json({ message: "Please provide tour is and user id !!" });
        }

        const subscription_info = await subscriptionModel.findOne({user_id:user_id})
        if(subscription_info?.isTrial){
            return res.status(400).json({message:"Please upgrade your account to publish tour."})
        }


        const remote_path = "images/tours/user-" + user_id + "/tour-" + tour_id;
        const distFolderPath = path.resolve(__dirname, '../../../' + remote_path);

        if (!fs.existsSync(distFolderPath)) {
            return res.status(400).json({ message: "Folder does not exist !!" });
        }

        try {
            // Delete all files for this tour here 
            await deleteFolderFromS3(bucketName, remote_path);

        } catch (error) {
            return res.status(400).json({ message: `Error on delete folder : ${error}` })
        }

        try {
            // upload on s3 published tour files here
            await uploadFoldertoS3(distFolderPath, remote_path);
        } catch (error) {
            return res.status(400).json({ message: `Error on upload folder : ${error}` })
        }

        let result = await tourModel.findByIdAndUpdate(tour_id, { status: 4 }, { new: true })
        return res.status(200).json({ message: "Tour Published Successufully !!", data: result });

    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }
}

const deleteFolderFromS3 = async (bucket: string, dir: string): Promise<void> => {
    const DeletePromises: Promise<DeleteObjectCommandOutput>[] = [];
    const { Contents } = await s3Config.send(
        new ListObjectsCommand({
            Bucket: bucket,
            Prefix: dir,
        }),
    );
    if (!Contents) return;
    Contents.forEach(({ Key }) => {
        DeletePromises.push(
            s3Config.send(
                new DeleteObjectCommand({
                    Bucket: bucket,
                    Key,
                }),
            ),
        );
    });
    await Promise.all(DeletePromises);
}


const uploadFoldertoS3 = async (local_folder: string, remote_folder: string) => {

    fs.readdir(local_folder, async (error: any, contents: any) => {
        if (error) throw error;
        if (!contents || contents.length === 0) return;

        for (const content of contents) {

            const content_path = path.join(local_folder, content);

            if (fs.lstatSync(content_path).isDirectory()) {
                await uploadFoldertoS3(
                    content_path,
                    path.join(remote_folder, content),
                );
            } else {
                fs.readFile(content_path, async (error: any, file_content: any) => {
                    let pathUpload = path.join(remote_folder, content);
                    const file = await s3Config.send(
                        new PutObjectCommand({
                            Bucket: bucketName,
                            Key: pathUpload.replace(/\\/g, "/"),
                            Body: file_content,
                        })
                    );
                });
            }
        }
    });
};


export const getObjectUrl: RequestHandler = async (req, res) => {
    // For public bucket url - https://s3.amazonaws.com/<YOUR_BUCKET_NAME>/<YOUR_OBJECT_KEY>
    const key = req.body.file_path;
    if (!key) {
        return res.status(400).json({ message: "Please provide object path !!" });
    }
    try {
        let command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        try {
            const response = await s3Config.send(
                new HeadObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                })
            );
            console.log("object exist------------" + response);
        } catch (err) {
            return res.status(400).json({ message: "Object not available !!" });
        }

        const url = await getSignedUrl(s3Config, command, { expiresIn: 30 });

        return res.status(200).json({ message: "Successfully!!", data: url })

    } catch (error) {
        console.log("error on url :" + error);
        return res.status(400).json({ message: "Internal server error !" });
    }
}
