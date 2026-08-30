import type { Role } from "./index.ts";

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  hospital?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ActivateRequest {
  invite_code: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: Role;
}

export type RegisterResponse = AuthResponse;
export type LoginResponse = AuthResponse;
export type ActivateResponse = AuthResponse;

export interface UserPayload {
  sub: string; // user id
  role: Role;
  iat: number;
  exp: number;
}