import express from "express";
import AuthController from "../controllers/AuthController";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  googleUrlSchema,
  googleCallbackSchema,
  googleCompleteProfileSchema,
  magicLinkRequestSchema,
  magicLinkVerifySchema,
} from "../validation/auth";

class AuthRouter {
  public authRouter;

  constructor() {
    this.authRouter = express.Router();
    this.routes();
  }

  private routes() {        
    this.authRouter.post("/register", validate(registerSchema), AuthController.register);
    this.authRouter.post("/login", validate(loginSchema), AuthController.login);
    
    this.authRouter.get("/google/url", validate(googleUrlSchema), AuthController.getGoogleAuthUrl);
    this.authRouter.post("/google/callback", validate(googleCallbackSchema), AuthController.googleCallback);
    this.authRouter.post("/google/complete-profile", validate(googleCompleteProfileSchema), AuthController.googleCompleteProfile);
    
    this.authRouter.post("/magic-link/request", validate(magicLinkRequestSchema), AuthController.requestMagicLink);
    this.authRouter.get("/magic-link/verify", validate(magicLinkVerifySchema), AuthController.verifyMagicLink);
    this.authRouter.post("/refresh", validate(refreshTokenSchema), AuthController.refreshToken);
    
    this.authRouter.post("/logout", authenticate, AuthController.logout);
    this.authRouter.get("/me", authenticate, AuthController.getCurrentUser);
  }
}

export default new AuthRouter().authRouter;
