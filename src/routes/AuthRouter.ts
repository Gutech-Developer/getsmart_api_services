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
  forgotPasswordSchema,
  forgotPasswordVerifySchema,
  resetPasswordSchema,
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
    
    this.authRouter.post("/activation/resend", validate(magicLinkRequestSchema), AuthController.resendActivation);
    this.authRouter.get("/activation/verify", validate(magicLinkVerifySchema), AuthController.verifyActivation);
    
    this.authRouter.post("/forgot-password", validate(forgotPasswordSchema), AuthController.forgotPassword);
    this.authRouter.get("/forgot-password/verify", validate(forgotPasswordVerifySchema), AuthController.verifyForgotPassword);
    this.authRouter.post("/reset-password", validate(resetPasswordSchema), AuthController.resetPassword);

    this.authRouter.post("/refresh", validate(refreshTokenSchema), AuthController.refreshToken);
    
    this.authRouter.post("/logout", authenticate, AuthController.logout);
    this.authRouter.get("/me", authenticate, AuthController.getCurrentUser);
  }
}

export default new AuthRouter().authRouter;
