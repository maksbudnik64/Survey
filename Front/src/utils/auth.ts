import type { PublicUser } from '../types/index'

export function saveAuth(token: string, user: PublicUser){
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

export function getToken(): string | null{
    return localStorage.getItem('token')
}

export function getUser(): PublicUser | null{
   const user = localStorage.getItem('user')
   return user ? JSON.parse(user) : null;
}

export function isAuthenticated(): boolean{
    return !!getToken();
}

export function logout(){
    localStorage.removeItem('token')
    localStorage.removeItem('user')

}