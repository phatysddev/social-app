import jwt from "jsonwebtoken";

import { InternalServerError } from "./error.util";

export interface PayloadJWT {
    id: string;
    username: string;
}

const signToken = (payload: PayloadJWT): string => {
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "1h",
        algorithm: "HS256"
    });

    return token;
};

const signRefreshToken = (payload: PayloadJWT): string => {
    const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
        expiresIn: "7d",
        algorithm: "HS256"
    });

    return token;
};

const verifyToken = (token: string): any => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        return decoded;
    } catch (error) {
        return new InternalServerError("failed sign jwt")
    }
};

const verifyRefreshToken = (token: string): any => {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string);
    return decoded;
};

export { signToken, verifyToken, signRefreshToken, verifyRefreshToken };
