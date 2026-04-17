import { Request, Response } from "express";
import AuthService from "../services/AuthService";
import {
  RegisterInput,
  LoginInput,
  GoogleCallbackInput,
  GoogleCompleteProfileInput,
  MagicLinkVerifyInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  RefreshTokenInput,
} from "../types/auth.types";
import { sendSuccess, sendError } from "../utils/response";

class AuthController {    

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: RegisterInput = req.body;
      const result = await AuthService.register(input);

      sendSuccess(res, 201, "Registrasi berhasil. Silakan cek email untuk aktivasi akun.", result);
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
      
  public resendActivation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      await AuthService.resendActivation(email);
      
      sendSuccess(res, 200, "Jika email terdaftar dan belum aktif, link aktivasi telah dikirim.");
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Resend activation error:", error);
      sendError(res, 500, "Internal server error");
    }
  };

  public verifyActivation = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: MagicLinkVerifyInput = { token: req.query.token as string };
      const result = await AuthService.verifyActivation(input);

      sendSuccess(res, 200, "Akun berhasil diaktifkan", result);
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Verify activation error:", error);
      sendError(res, 500, "Internal server error");
    }
  };

  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: ForgotPasswordInput = req.body;
      await AuthService.forgotPassword(input);
      
      sendSuccess(res, 200, "Jika email terdaftar, link reset password telah dikirim ke email Anda.");
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Forgot password error:", error);
      sendError(res, 500, "Internal server error");
    }
  };

  public verifyForgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: MagicLinkVerifyInput = { token: req.query.token as string };
      const result = await AuthService.verifyForgotPassword(input);

      sendSuccess(res, 200, "Token valid. Silakan masukkan password baru.", result);
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Verify forgot password error:", error);
      sendError(res, 500, "Internal server error");
    }
  };

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: ResetPasswordInput = req.body;
      await AuthService.resetPassword(input);

      sendSuccess(res, 200, "Password berhasil direset. Silakan login dengan password baru.");
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error("Reset password error:", error);
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
