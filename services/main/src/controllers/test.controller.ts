import { Request, Response } from "express";

const testController = (_: Request, res: Response) => {
    res.status(200).json({
        message: "Hello World"
    });
};

export default testController;