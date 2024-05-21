import { DateTime } from "luxon"
import userModel from "../../model/user/userModel"
import getisotime from "../../utils/time"
import userModelLog from "../../model/log/user/userModelLog"
import jwt from "jsonwebtoken"
import { log } from "../../index";
import { RequestHandler } from "express"
import bcrypt from "bcryptjs"


export const signout: RequestHandler = async (req, res) => {
    let date = getisotime(DateTime)
    let secret = process.env.DB_AUTH_SECRET || "xtsecure" //change it

    try {
        if (!req.session?.token) {
            return res.status(400).json({ message: "You have already signed out" })
        }

        let tokenData: any = jwt.verify(req.session.token, secret)
        let { email, user_id } = tokenData
        console.log(email, user_id);
        let loggedinstatus = await userModel.findOneAndUpdate({ email }, { isSignIn: false, updated_at: date, updated_by: user_id }, { new: true }) // add updated by 
        if (loggedinstatus) {
            let { _id, ...modifystatus } = loggedinstatus._doc
            await userModelLog.create({
                user_id: loggedinstatus._id.toString(),
                ...modifystatus,
                changed_fields: ["isSignIn"]
            })
            log.info(`User signOut successfully - ${email}`)
            req.session.destroy(() => { })
            res.status(200).json({ message: "SignOut Succesfully " })
        } else {
            res.status(400).json({ message: "Something went wrong !!" })
        }


    } catch (error) {
        res.status(400).json({ message: "Something went wrong " + error })
        log.error(`User signOut failed ` + error)
    }
}

export const changepassword: RequestHandler = async (req, res) => {
    const { id, oldPassword, newPassword, confirmPassword } = req.body;
    try {
        let user = await userModel.findById(id)


        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!oldPassword) {
            return res.status(401).json({ message: 'Old password is required' });

        }
        if (!newPassword) {
            return res.status(401).json({ message: 'New password is required' });

        }

        if (newPassword != confirmPassword) {
            return res.status(401).json({ message: 'Confirm password not matched' });
        }

        const dpass = await bcrypt.compare(oldPassword, user.password);
        if (!dpass) {
            return res.status(401).json({ message: 'Invalid old password', invalid_old: true });
        }

        if (dpass) {
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            let updatepassword = await userModel.findByIdAndUpdate(id, { password: hashedPassword }, { new: true })

            if (updatepassword) {
                let { _id, ...usermodify } = updatepassword._doc


                await userModelLog.create({
                    ...usermodify,
                    changed_fields: ["password"],
                    user_id: id,
                    updated_by: id
                })

                res.status(200).json({ message: "Password changed successfully !!" });
            } else {
                res.status(400).json({ message: "Something went wrong !!" })
            }


        }

    } catch (error) {
        res.status(404).json({ message: "Something went wrong" + error });
    }
}

export default signout