import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { PublicUser, ApiResponse } from "../types.ts";
import { insertNewUser, selectUserByEmail } from "../repositories/userRepository.ts";

dotenv.config();

export async function createUser(email: string, password: string): 
Promise<ApiResponse<{
    token: string,
    user: PublicUser}>> {
    const check = await selectUserByEmail(email);

    if (!check.success) {
        return { success: false, error: check.error };
    }

    if (check.data) {
        return { success: false, error: "A user with this email address already exists" };
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await insertNewUser(email, password_hash);

    if (!result.success) {
    return { success: false, error: result.error };
}

if (!result.data) {
    return { success: false, error: "User created but not found" };
}

    const token = generateJWT(result.data.id, email);

    return {
        success: true,
        data: {
            token: token,
            user: {
            id: result.data.id,
            email: email,
        }}
    };
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
    return {success: false, error: "Invalid email"};
}

const compare = await bcrypt.compare(password, check.data.password_hash)
if (!compare) {
return {success: false, error: "Invalid password"}
}
const token = generateJWT(check.data.id, email)
return {
        success: true,
        data: {
            token: token,
            user: {
            id: check.data.id,
            email: email,
        }}
    };
}

function generateJWT(userId: number, email: string) {
    const token = jwt.sign(
        { id: userId, email: email },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
    );
    return token;
}