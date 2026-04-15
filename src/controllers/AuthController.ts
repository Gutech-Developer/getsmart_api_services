import { Request, Response } from "express";
import AuthService from "../services/AuthService";
import {
  RegisterInput,
  LoginInput,
  GoogleCallbackInput,
  GoogleCompleteProfileInput,
  MagicLinkRequestInput,
  MagicLinkVerifyInput,
  RefreshTokenInput,
} from "../types/auth.types";
import { sendSuccess, sendError } from "../utils/response";

class AuthController {    

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: RegisterInput = req.body;
      const result = await AuthService.register(input);

      sendSuccess(res, 201, "Registrasi berhasil", result);
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Register error:", error);
      sendError(res, 500, "Internal server error");
    }
  };
      
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: LoginInput = req.body;
      const result = await AuthService.login(input);

      sendSuccess(res, 200, "Login berhasil", result);
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Login error:", error);
      sendError(res, 500, "Internal server error");
    }
  };
        
  public getGoogleAuthUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const redirectUri = req.query.redirectUri as string;
      const url = AuthService.getGoogleAuthUrl(redirectUri);

      sendSuccess(res, 200, "Google OAuth URL berhasil dibuat", { url });
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Google auth URL error:", error);
      sendError(res, 500, "Internal server error");
    }
  };
        
  public googleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: GoogleCallbackInput = req.body;
      const result = await AuthService.googleCallback(input);

      if (result.isNewUser) {
        sendSuccess(res, 200, "User baru terdeteksi. Silakan lengkapi profil.", {
          isNewUser: true,
          tempToken: result.tempToken,
          googleProfile: result.googleProfile,
        });
      } else {
        sendSuccess(res, 200, "Login Google berhasil", {
          isNewUser: false,
          ...result.auth,
        });
      }
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Google callback error:", error);
      sendError(res, 500, "Internal server error");
    }
  };
        
  public googleCompleteProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: GoogleCompleteProfileInput = req.body;
      const result = await AuthService.googleCompleteProfile(input);

      sendSuccess(res, 201, "Registrasi via Google berhasil", result);
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Google complete profile error:", error);
      sendError(res, 500, "Internal server error");
    }
  };
      
  public requestMagicLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: MagicLinkRequestInput = req.body;
      await AuthService.requestMagicLink(input);
      
      sendSuccess(res, 200, "Jika email terdaftar, magic link telah dikirim ke email Anda");
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Magic link request error:", error);
      sendError(res, 500, "Internal server error");
    }
  };
      
  public verifyMagicLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: MagicLinkVerifyInput = { token: req.query.token as string };
      const result = await AuthService.verifyMagicLink(input);

      sendSuccess(res, 200, "Magic link verified", result);
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Magic link verify error:", error);
      sendError(res, 500, "Internal server error");
    }
  };
      
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: RefreshTokenInput = req.body;
      const tokens = await AuthService.refreshToken(input);

      sendSuccess(res, 200, "Token berhasil diperbarui", { tokens });
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Refresh token error:", error);
      sendError(res, 500, "Internal server error");
    }
  };
      
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { refreshToken } = req.body;

      await AuthService.logout(userId, refreshToken);

      sendSuccess(res, 200, "Logout berhasil");
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Logout error:", error);
      sendError(res, 500, "Internal server error");
    }
  };
      
  public getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const user = await AuthService.getCurrentUser(userId);

      sendSuccess(res, 200, "Data user berhasil diambil", { user });
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Get current user error:", error);
      sendError(res, 500, "Internal server error");
    }
  };
  
}

export default new AuthController();
