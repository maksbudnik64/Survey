import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { PublicUser, ApiResponse } from "../types.ts";
import { insertNewUser, selectUserByEmail } from "../repositories/userRepository.ts";
import { errors, ok } from "../utils/helpers.ts";

dotenv.config();

export async function createUser(email: string, password: string): 
Promise<ApiResponse<{
    token: string,
    user: PublicUser}>> {
    const check = await selectUserByEmail(email);

    if (!check.success) {
        return check;
    }

    if (check.data) {
        return errors.emailExists();
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await insertNewUser(email, password_hash);

    if (!result.success) {
    return result;
}

if (!result.data) return errors.internal("Unexpected error");

    const token = generateJWT(result.data.id, email);

    return ok({
            token: token,
            user: {
            id: result.data.id,
            email: email,
        }});
    
}

export async function login(email: string, password: string): 
Promise<ApiResponse<{
    token: string,
    user: PublicUser}>>
{
   const check = await selectUserByEmail(email);
   if (!check.success){
    return check;
   }
if (!check.data){
    return errors.invalidCredentials();
}

const compare = await bcrypt.compare(password, check.data.password_hash)
if (!compare) {
return errors.invalidCredentials();}
const token = generateJWT(check.data.id, email)
return ok({
            token: token,
            user: {
            id: check.data.id,
            email: email,
        }}
    );
}

function generateJWT(userId: number, email: string) {
    const token = jwt.sign(
        { id: userId, email: email },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
    );
    return token;
}