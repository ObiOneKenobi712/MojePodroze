import { USER_LOGIN, USER_PASSWORD } from "@_config/env.config";
import { LoginUserModel } from "@_src/models/user.model";

export const testUser1: LoginUserModel = {
  userLogin: USER_LOGIN,
  userPassword: USER_PASSWORD,
};
