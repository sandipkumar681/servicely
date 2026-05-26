import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler<TReq extends Request = Request> = (
  req: TReq,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export const AsyncHandler = <TReq extends Request = Request>(
  handler: AsyncRequestHandler<TReq>,
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req as TReq, res, next)).catch(next);
  };
};
