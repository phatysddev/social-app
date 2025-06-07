import argon2 from "argon2";

const hashPassword = async (password: string): Promise<string> => {
    return await argon2.hash(password);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
};

export { hashPassword, verifyPassword };