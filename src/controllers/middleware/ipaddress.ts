import { NextFunction, RequestHandler } from 'express';
import requestIp from "request-ip";

// inside middleware handler
const ipMiddleware: RequestHandler = (req, res, next) => {
    const clientIp = requestIp.getClientIp(req);
    next();
};

export default ipMiddleware