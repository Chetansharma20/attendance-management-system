import { IUser } from "../modules/user/users.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
