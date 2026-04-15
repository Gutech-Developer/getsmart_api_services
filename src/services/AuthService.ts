import bcryptjs from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { Op } from "sequelize";
import {
  User,
  Student,
  Teacher,
  Parent,
  SystemRole,
  SystemUserRole,
  RefreshToken,
  MagicLinkToken,
} from "../models";
import {
  RegisterInput,
  LoginInput,
  GoogleCallbackInput,
  GoogleCompleteProfileInput,
  GoogleTempPayload,
  MagicLinkRequestInput,
  MagicLinkVerifyInput,
  RefreshTokenInput,
  AuthResponse,
  JwtPayload,
  TokenPair,
} from "../types/auth.types";
import { SystemRoleEnum, AuthProviderEnum } from "../types/enums";
import {
  generateTokenPair,
  verifyRefreshToken,
  generateMagicLinkToken,
  generateGoogleTempToken,
  verifyGoogleTempToken,
  REFRESH_TOKEN_EXPIRY_MS,
} from "../utils/jwt";
import { sendMagicLinkEmail } from "../utils/email";

const BCRYPT_SALT_ROUNDS = 12;
const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

// Initialize with client_secret for Authorization Code Flow (server-to-server token exchange)
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

class AuthService {
  // ============================
  // REGISTER (Email + Password)
  // ============================
  public register = async (input: RegisterInput): Promise<AuthResponse> => {
    const existingUser = await User.findOne({ where: { email: input.email } });
    if (existingUser) {
      throw { status: 409, message: "Email sudah terdaftar" };
    }

    const hashedPassword = await bcryptjs.hash(input.password, BCRYPT_SALT_ROUNDS);

    const user = await User.create({
      email: input.email,
      password: hashedPassword,
      isActive: true,
      authProvider: AuthProviderEnum.LOCAL,
    });

    // Assign role
    const systemRole = await this.findOrCreateRole(input.role);
    await SystemUserRole.create({
      userId: user.id,
      systemRoleId: systemRole.id,
    });

    // Create profile based on role
    const profile = await this.createProfile(user.id, input);

    // Generate tokens
    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: input.role,
    };
    const tokens = generateTokenPair(jwtPayload);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        role: input.role,
        profile,
      },
      tokens,
    };
  };

  // ============================
  // LOGIN (Email + Password)
  // ============================
  public login = async (input: LoginInput): Promise<AuthResponse> => {
    const user = await User.scope("withPassword").findOne({
      where: { email: input.email },
    });

    if (!user) {
      throw { status: 401, message: "Email atau password salah" };
    }

    if (!user.isActive) {
      throw { status: 403, message: "Akun tidak aktif" };
    }

    if (!user.password) {
      throw {
        status: 400,
        message: "Akun ini terdaftar melalui Google/Magic Link. Silakan gunakan metode login yang sesuai.",
      };
    }

    const isPasswordValid = await bcryptjs.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw { status: 401, message: "Email atau password salah" };
    }

    const { role, profile } = await this.getUserRoleAndProfile(user.id);

    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role,
    };
    const tokens = generateTokenPair(jwtPayload);

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        role,
        profile,
      },
      tokens,
    };
  };

  // ============================
  // GOOGLE OAuth - Step 1: Generate Auth URL
  // ============================
  public getGoogleAuthUrl = (redirectUri: string): string => {
    return googleClient.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      redirect_uri: redirectUri,
      prompt: "consent",
    });
  };

  // ============================
  // GOOGLE OAuth - Step 2: Exchange Code (Authorization Code Flow)
  // Backend exchanges authorization code with Google server-to-server.
  // User data comes directly from Google — never from the frontend.
  // ============================
  public googleCallback = async (
    input: GoogleCallbackInput,
  ): Promise<
    | { isNewUser: false; auth: AuthResponse }
    | { isNewUser: true; tempToken: string; googleProfile: GoogleTempPayload }
  > => {
    // Exchange authorization code for tokens (server-to-server with client_secret)
    let tokens: { id_token?: string | null };
    try {
      const response = await googleClient.getToken({
        code: input.code,
        redirect_uri: input.redirectUri,
      });
      tokens = response.tokens;
    } catch {
      throw {
        status: 400,
        message: "Authorization code tidak valid atau sudah kedaluwarsa",
      };
    }

    if (!tokens.id_token) {
      throw { status: 400, message: "Gagal mendapatkan data dari Google" };
    }

    // Verify the ID token obtained from Google's server (NOT from frontend)
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw { status: 400, message: "Data Google tidak valid" };
    }

    // Check if user already exists
    let user = await User.findOne({
      where: {
        [Op.or]: [{ email: payload.email }, { googleId: payload.sub }],
      },
    });

    if (!user) {
      // New user — return a signed temp token for profile completion
      // The temp token contains ONLY data from Google's verified response
      const googleProfile: GoogleTempPayload = {
        email: payload.email,
        name: payload.name || "User",
        picture: payload.picture,
        googleId: payload.sub!,
      };

      const tempToken = generateGoogleTempToken(googleProfile);

      return {
        isNewUser: true,
        tempToken,
        googleProfile,
      };
    }

    // Existing user — link Google account if not already linked
    if (!user.googleId) {
      await User.update(
        { googleId: payload.sub, authProvider: AuthProviderEnum.GOOGLE },
        { where: { id: user.id } },
      );
    }

    if (!user.isActive) {
      throw { status: 403, message: "Akun tidak aktif" };
    }

    const { role, profile } = await this.getUserRoleAndProfile(user.id);

    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role,
    };
    const authTokens = generateTokenPair(jwtPayload);

    await this.storeRefreshToken(user.id, authTokens.refreshToken);

    return {
      isNewUser: false,
      auth: {
        user: {
          id: user.id,
          email: user.email,
          isActive: user.isActive,
          role,
          profile,
        },
        tokens: authTokens,
      },
    };
  };

  // ============================
  // GOOGLE OAuth - Step 3: Complete Profile (new users only)
  // Verifies the backend-signed temp token and creates the user.
  // ============================
  public googleCompleteProfile = async (
    input: GoogleCompleteProfileInput,
  ): Promise<AuthResponse> => {
    // Verify the temp token (signed by our server, contains Google profile data)
    let googleData: GoogleTempPayload;
    try {
      googleData = verifyGoogleTempToken(input.tempToken);
    } catch {
      throw {
        status: 401,
        message: "Token tidak valid atau sudah kedaluwarsa. Silakan ulangi proses Google login.",
      };
    }

    // Guard against double-submit
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: googleData.email }, { googleId: googleData.googleId }],
      },
    });

    if (existingUser) {
      throw { status: 409, message: "Akun sudah terdaftar. Silakan login." };
    }

    // Create user with data from Google (NOT from frontend)
    const user = await User.create({
      email: googleData.email,
      password: null,
      isActive: true,
      authProvider: AuthProviderEnum.GOOGLE,
      googleId: googleData.googleId,
    });

    // Assign role
    const systemRole = await this.findOrCreateRole(input.role);
    await SystemUserRole.create({
      userId: user.id,
      systemRoleId: systemRole.id,
    });

    // Create profile — fullName defaults to Google's name if not provided
    await this.createProfile(user.id, {
      email: googleData.email,
      password: "",
      fullName: input.fullName || googleData.name,
      phoneNumber: input.phoneNumber || "",
      role: input.role,
      NIS: input.NIS,
      NIP: input.NIP,
      province: input.province,
      city: input.city,
      schoolId: input.schoolId,
      schoolName: input.schoolName,
    });

    const { role, profile } = await this.getUserRoleAndProfile(user.id);

    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role,
    };
    const tokens = generateTokenPair(jwtPayload);

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        role,
        profile,
      },
      tokens,
    };
  };

  // ============================
  // MAGIC LINK - Request
  // ============================
  public requestMagicLink = async (input: MagicLinkRequestInput): Promise<void> => {
    const user = await User.findOne({ where: { email: input.email } });
    if (!user) {
      // Silent fail for security (don't reveal if email exists)
      return;
    }

    if (!user.isActive) {
      return;
    }

    // Invalidate previous tokens
    await MagicLinkToken.update(
      { isUsed: true },
      { where: { email: input.email, isUsed: false } },
    );

    const token = generateMagicLinkToken();

    await MagicLinkToken.create({
      email: input.email,
      token,
      expiresAt: new Date(Date.now() + MAGIC_LINK_EXPIRY_MS),
    });

    await sendMagicLinkEmail(input.email, token);
  };

  // ============================
  // MAGIC LINK - Verify
  // ============================
  public verifyMagicLink = async (input: MagicLinkVerifyInput): Promise<AuthResponse> => {
    const magicLinkToken = await MagicLinkToken.findOne({
      where: { token: input.token, isUsed: false },
    });

    if (!magicLinkToken) {
      throw { status: 400, message: "Token tidak valid atau sudah digunakan" };
    }

    if (magicLinkToken.isExpired()) {
      throw { status: 400, message: "Token sudah kedaluwarsa" };
    }

    // Mark token as used
    magicLinkToken.isUsed = true;
    await magicLinkToken.save();

    let user = await User.findOne({ where: { email: magicLinkToken.email } });

    if (!user) {
      throw { status: 404, message: "User tidak ditemukan" };
    }

    if (!user.isActive) {
      throw { status: 403, message: "Akun tidak aktif" };
    }

    const { role, profile } = await this.getUserRoleAndProfile(user.id);

    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role,
    };
    const tokens = generateTokenPair(jwtPayload);

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        role,
        profile,
      },
      tokens,
    };
  };

  // ============================
  // REFRESH TOKEN
  // ============================
  public refreshToken = async (input: RefreshTokenInput): Promise<TokenPair> => {
    let decoded: JwtPayload;

    try {
      decoded = verifyRefreshToken(input.refreshToken);
    } catch {
      throw { status: 401, message: "Refresh token tidak valid atau sudah kedaluwarsa" };
    }

    const storedToken = await RefreshToken.findOne({
      where: { token: input.refreshToken, userId: decoded.userId },
    });

    if (!storedToken || storedToken.isExpired()) {
      if (storedToken) {
        await storedToken.destroy();
      }
      throw { status: 401, message: "Refresh token tidak valid atau sudah kedaluwarsa" };
    }

    // Delete old refresh token (rotation)
    await storedToken.destroy();

    // Get current role (might have changed)
    const { role } = await this.getUserRoleAndProfile(decoded.userId);

    const newPayload: JwtPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role,
    };
    const tokens = generateTokenPair(newPayload);

    await this.storeRefreshToken(decoded.userId, tokens.refreshToken);

    return tokens;
  };

  // ============================
  // LOGOUT
  // ============================
  public logout = async (userId: string, refreshToken?: string): Promise<void> => {
    if (refreshToken) {
      // Logout specific session
      await RefreshToken.destroy({
        where: { userId, token: refreshToken },
      });
    } else {
      // Logout all sessions
      await RefreshToken.destroy({ where: { userId } });
    }
  };

  // ============================
  // GET CURRENT USER
  // ============================
  public getCurrentUser = async (userId: string): Promise<AuthResponse["user"]> => {
    const user = await User.findByPk(userId);
    if (!user) {
      throw { status: 404, message: "User tidak ditemukan" };
    }

    const { role, profile } = await this.getUserRoleAndProfile(userId);

    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      role,
      profile,
    };
  };

  // ============================
  // PRIVATE HELPERS
  // ============================

  private findOrCreateRole = async (roleName: SystemRoleEnum): Promise<SystemRole> => {
    const [role] = await SystemRole.findOrCreate({
      where: { name: roleName },
      defaults: { name: roleName },
    });
    return role;
  };

  private createProfile = async (
    userId: string,
    input: RegisterInput,
  ): Promise<Record<string, unknown>> => {
    const profileData = {
      userId,
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      province: input.province || "Aceh",
      city: input.city || "Banda Aceh",
    };

    switch (input.role) {
      case SystemRoleEnum.STUDENT: {
        const student = await Student.create({
          ...profileData,
          NIS: input.NIS || null,
          schoolId: input.schoolId || "01",
          schoolName: input.schoolName || "MTsN Model Banda Aceh",
        });
        return student.toJSON() as unknown as Record<string, unknown>;
      }
      case SystemRoleEnum.TEACHER: {
        const teacher = await Teacher.create({
          ...profileData,
          NIP: input.NIP || null,
          schoolId: input.schoolId || "01",
          schoolName: input.schoolName || "MTsN Model Banda Aceh",
        });
        return teacher.toJSON() as unknown as Record<string, unknown>;
      }
      case SystemRoleEnum.PARENT: {
        const parent = await Parent.create(profileData);
        return parent.toJSON() as unknown as Record<string, unknown>;
      }
      default:
        throw { status: 400, message: "Role tidak valid" };
    }
  };

  private getUserRoleAndProfile = async (
    userId: string,
  ): Promise<{ role: SystemRoleEnum; profile: Record<string, unknown> | null }> => {
    const systemUserRole = await SystemUserRole.findOne({
      where: { userId },
      include: [{ model: SystemRole, as: "systemRole" }],
    });

    if (!systemUserRole) {
      throw { status: 500, message: "User role tidak ditemukan" };
    }

    const role = (systemUserRole as any).systemRole.name as SystemRoleEnum;
    let profile: Record<string, unknown> | null = null;

    switch (role) {
      case SystemRoleEnum.STUDENT: {
        const student = await Student.findOne({ where: { userId } });
        profile = student ? (student.toJSON() as unknown as Record<string, unknown>) : null;
        break;
      }
      case SystemRoleEnum.TEACHER: {
        const teacher = await Teacher.findOne({ where: { userId } });
        profile = teacher ? (teacher.toJSON() as unknown as Record<string, unknown>) : null;
        break;
      }
      case SystemRoleEnum.PARENT: {
        const parent = await Parent.findOne({ where: { userId } });
        profile = parent ? (parent.toJSON() as unknown as Record<string, unknown>) : null;
        break;
      }
      case SystemRoleEnum.ADMIN:
        profile = null;
        break;
    }

    return { role, profile };
  };

  private storeRefreshToken = async (userId: string, token: string): Promise<void> => {
    await RefreshToken.create({
      userId,
      token,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    });

    // Cleanup: remove expired tokens for this user
    await RefreshToken.destroy({
      where: {
        userId,
        expiresAt: { [Op.lt]: new Date() },
      },
    });
  };
}

export default new AuthService();
