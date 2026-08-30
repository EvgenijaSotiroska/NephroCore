export type Role = "doctor" | "patient";

export interface JwtPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
}