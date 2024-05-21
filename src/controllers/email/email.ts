import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars"


import path from 'path';
import dotenv from 'dotenv';


const envPath = path.resolve(__dirname, '..', '.env');
const viewPath = path.resolve(__dirname,'../../..','view');
dotenv.config({ path: envPath });

const MailSendCustomer = (sendingmail:any) => {
    console.log(process.env.EMAIL_PASSWORD,"----",process.env.EMAIL_USERNAME);
    const transporter = nodemailer.createTransport({
    //    host:"email-smtp.us-east-1.amazonaws.com",
    //    port:465,
        // secure:true,
        service:"Gmail",
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const handlebaroption = {
        viewEngine: {
            partialsDir: viewPath+"/partials",
            layoutsDir: viewPath+"/layouts",
        },
        viewPath:viewPath
    };

    transporter.use("compile", hbs(handlebaroption));
    //  transporter.use('compile', hbs({
    //      viewEngine: 'express-handlebars',
    //      viewPath: "./src/view"
    //  }))

    transporter.sendMail(sendingmail, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });


}
export default MailSendCustomer
