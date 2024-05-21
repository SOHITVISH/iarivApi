import { RequestHandler } from "express"
import communityQuestionModel from "../../model/community/communityQuestionModel"
import getisotime from "../../utils/time"
import { DateTime } from "luxon"
import communityAnswerModel from "../../model/community/communityAnswersModel"
import userModel from "../../model/user/userModel"



export const askquestion: RequestHandler = async (req, res) => {
    let { user_id, question } = req.body
    try {

        let check = await userModel.findById(user_id)
        if (check?.status != 1) {
            return res.status(400).json({ message: 'Please signin to ask question' });

        }

        let data = await communityQuestionModel.create({
            user_id: user_id,
            question: question,
            status: 35
        })

        res.status(200).json({ message: "Question create successfully", result: data })

    } catch (error: any) {
        return res.status(500).json({ message: error.message })

    }

}

export const deletequestion: RequestHandler = async (req, res) => {
    let { question_id } = req.body

    let date = getisotime(DateTime)

    try {
        let data: any = await communityQuestionModel.findById(question_id)

        if (data.status == 35) {
            await communityQuestionModel.findByIdAndUpdate(question_id, { status: 36, updated_at: date }, { new: true })
            return res.status(200).json({ message: "Question delete successfully" })
        } else {
            return res.status(200).json({ message: "Question no longer now avialable" })
        }

    } catch (error: any) {
        return res.status(500).json({ message: error.message })

    }

}

export const likequestion: RequestHandler = async (req, res) => {
    let { user_id, question_id } = req.body
    let date = getisotime(DateTime)
    try {
        let checkuser = await userModel.findById(user_id)
        if (checkuser?.status != 1) {
            return res.status(400).json({ message: 'Please signin to ask question' });

        }

        let question = await communityQuestionModel.findById(question_id)

        if (!question) {
            return res.status(400).json({ message: "Question not found !!" })
        }

        let check = await communityQuestionModel.findOne({ "liked_by.user_id": user_id })

        if (check) {
            await communityQuestionModel.findOneAndUpdate({ "liked_by.user_id": user_id }, { "$set": { "liked_by.$.isQuestionLiked": false, "liked_by.$.unliked_at": date, } }, { new: true })
            return res.json({ message: "Question unLiked" })
        }

        let likequestion = await communityQuestionModel.findByIdAndUpdate(question_id, { $push: { liked_by: { user_id: user_id, liked_at: date, isQuestionLiked: true, } } }, { new: true })

        res.json({ message: "Question liked" });

    } catch (err: any) {
        return res.status(500).json({ message: err.message })

    }
}

export const dislikequestion: RequestHandler = async (req, res) => {
    let { user_id, question_id } = req.body
    let date = getisotime(DateTime)
    try {

        let checkuser = await userModel.findById(user_id)
        if (checkuser?.status != 1) {
            return res.status(400).json({ message: 'Please signin to ask question' });

        }

        let question = await communityQuestionModel.findById(question_id)

        if (!question) {
            return res.status(400).json({ message: "Question not found !!" })
        }

        let check = await communityQuestionModel.findOne({ "disliked_by.user_id": user_id })
        if (check) {
            await communityQuestionModel.findOneAndUpdate({ "disliked_by.user_id": user_id }, { "$set": { "disliked_by.$.user_id": user_id, "disliked_by.$.isQuestionDisliked": false, "disliked_by.$.undisliked_at": date } }, { new: true })
            return res.json({ message: "Question undisliked" })
        }

        let dislikequestion = await communityQuestionModel.findByIdAndUpdate(question_id, { $push: { disliked_by: { user_id: user_id, disliked_at: date, isQuestionDisliked: true } } }, { new: true })
        res.json({ message: "Question disliked" });


    } catch (err: any) {
        return res.status(500).json({ message: err.message })

    }
}

export const giveanswer: RequestHandler = async (req, res) => {
    let { user_id, question_id, answer } = req.body

    let date = getisotime(DateTime)
    try {

        let checkuser = await userModel.findById(user_id)
        if (checkuser?.status != 1) {
            return res.status(400).json({ message: 'Please signin to ask question' });

        }

        let question = await communityQuestionModel.findById(question_id)

        if (!question) {
            return res.status(400).json({ message: "Question not found !!" })
        }
        let data = await communityAnswerModel.create({
            user_id,
            question_id,
            answer,
            status: 33,
            answer_by: user_id

        })

        res.status(200).json({ message: "Answer post successfully", result: data })

    } catch (err: any) {
        return res.status(400).json({ message: err.message })
    }
}

export const editanswer: RequestHandler = async (req, res) => {
    let { answer_id, answer } = req.body

    let date = getisotime(DateTime)

    try {
        let data = await communityAnswerModel.findByIdAndUpdate(answer_id, { answer: answer, updated_at: date }, { new: true })
        res.status(200).json({ message: "Answer update successfully", result: data })
    } catch (error: any) {
        return res.status(400).json({ message: error.message })
    }
}

export const answerdelete: RequestHandler = async (req, res) => {
    let { answer_id } = req.body

    try {

        let data = await communityAnswerModel.findByIdAndUpdate(answer_id, { status: 33 }, { new: true })

        if (data) {
            await communityAnswerModel.findByIdAndUpdate(answer_id, { status: 34 }, { new: true })
            return res.status(200).json({ message: "Answer delete successfully" })
        } else {
            return res.status(200).json({ message: "Answer doesn't exist" })
        }

    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export const getanswer: RequestHandler = async (req, res) => {
    let { question_id, user_id } = req.body
    let date = getisotime(DateTime)
    try {

        let checkquestion: any = await communityQuestionModel.findById(question_id)
        if (checkquestion.status != 35) {
            return res.status(400).json({ message: "Question no longer now available" })
        }

        let data = await communityAnswerModel.find({ question_id, status: 33 })
        let dataCount = await communityAnswerModel.find({ question_id, status: 33 }).countDocuments()

        if (!data) {
            return res.status(400).json({ message: "No answer yet !!" })
        }

        //Viewed by this user
        let check = await communityQuestionModel.findOne({ "viewed_by.user_id": user_id })

        if (check) {
            await communityQuestionModel.findOneAndUpdate({ "viewed_by.user_id": user_id }, { "$set": { "viewed_by.$.user_id": user_id, "viewed_by.$.isQuestionViewed": true, "viewed_by.$.viewed_at": date } }, { new: true })
            // return   res.status(200).json({ message: "Answer fetch successfully", result: data, totalAnswers: dataCount })
        } else {

            await communityQuestionModel.findByIdAndUpdate(question_id, { $push: { viewed_by: { user_id: user_id, viewed_at: date, isQuestionViewed: true } } }, { new: true })
        }


        res.status(200).json({ message: "Answer fetch successfully", result: data, totalAnswers: dataCount })
    } catch (error: any) {
        res.status(400).json({ message: error.message })

    }
}

export const getlikesofquestion: RequestHandler = async (req, res) => {
    let { question_id } = req.body
    try {

        let totalLikes = 0
        let dataDoc: any = await communityQuestionModel.findById(question_id)

        let doc: any = dataDoc.liked_by
        doc.forEach((element: any) => {
            if (element.isQuestionLiked) {
                totalLikes++
            }
        });

        res.status(200).json({ totalLikesOnQuestion: totalLikes })

    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }

}

export const getdislikesofquestion: RequestHandler = async (req, res) => {
    let { question_id } = req.body
    try {
        let totalDislikes = 0
        let dataDoc: any = await communityQuestionModel.findById(question_id)

        let doc: any = dataDoc.disliked_by
        doc.forEach((element: any) => {

            if (element.isQuestionDisliked) {
                totalDislikes++
            }

        });
        res.status(200).json({ totalDislikesOnQuestion: totalDislikes })
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }

}

export const gettotalviewsofquestion: RequestHandler = async (req, res) => {
    let { question_id } = req.body
    try {
        let totalViews = 0
        let dataDoc: any = await communityQuestionModel.findById(question_id)

        let doc: any = dataDoc.viewed_by
        doc.forEach((element: any) => {

            if (element.isQuestionViewed) {
                totalViews++
            }

        });
        res.status(200).json({ totalViewsOnQuestion: totalViews })
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }

}

export const replyonanswer: RequestHandler = async (req, res) => {
    let { user_id, replied_answer, answer_id } = req.body

    try {
        let data = await communityAnswerModel.findByIdAndUpdate(answer_id, { $push: { reply: { user_id: user_id, replied_answer: replied_answer, isRepliedAnswer: true } } }, { new: true })

        res.status(200).json({ message: "Replied successfully", result: data })
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export const replydelete: RequestHandler = async (req, res) => {
    let { replied_answer_id } = req.body

    try {
        let check = await communityAnswerModel.findOne({ "reply._id": replied_answer_id })
        if (check) {
            await communityAnswerModel.findOneAndUpdate({ "reply._id": replied_answer_id }, { "$set": { "reply.$.isRepliedAnswer": false, } }, { new: true })

        }

        res.status(200).json({ message: "Replied delete successfully" })
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export const getrepliedanswer: RequestHandler = async (req, res) => {
    let { answer_id } = req.body
    try {
        let replies
        let dataDoc: any = await communityAnswerModel.findById(answer_id)

        if (dataDoc.status == 33) {
            let doc: any = dataDoc.reply

            if (dataDoc) {
                replies = doc
            }

            return res.status(200).json({ message: "Replied fetch successfully", result: replies })

        } else {
            return res.status(400).json({ message: "Answer no longer now available" })

        }
    } catch (error: any) {
        res.status(400).json({ message: error.message })

    }
}

export const getreplycount: RequestHandler = async (req, res) => {
    let { answer_id } = req.body

    try {

        let replyCount = 0

        let dataDoc: any = await communityAnswerModel.findById(answer_id)

        if (dataDoc.status == 33) {
            let doc: any = dataDoc.reply

            doc.forEach((element: any) => {
                if (element.isRepliedAnswer) {
                    replyCount++
                }
            })
            return res.status(200).json({ message: "Replied count fetch successfully", result: replyCount })
        } else {
            return res.status(400).json({ message: "Answer no longer now available" })

        }

    } catch (error: any) {
        res.status(400).json({ message: error.message })

    }
}