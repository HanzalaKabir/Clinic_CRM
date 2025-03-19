import { JwtPayload } from "jsonwebtoken";

//some minor changes

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        clinic_id?: string;
      };
    }
  }
}
