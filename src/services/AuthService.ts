import bcryptjs from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { Op, UniqueConstraintError, Transaction } from "sequelize";
import { sequelize } from "../config/database";
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
  MagicLinkVerifyInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  RefreshTokenInput,
  AuthResponse,
  JwtPayload,
  TokenPair,
} from "../types/auth.types";
import { SystemRoleEnum, AuthProviderEnum, MagicLinkPurposeEnum } from "../types/enums";
import {
  generateTokenPair,
  verifyRefreshToken,
  generateMagicLinkToken,
  generateResetPasswordToken,
  verifyResetPasswordToken,
  generateGoogleTempToken,
  verifyGoogleTempToken,
  REFRESH_TOKEN_EXPIRY_MS,
} from "../utils/jwt";
import { sendActivationEmail, sendForgotPasswordEmail } from "../utils/email";

const BCRYPT_SALT_ROUNDS = 12;
const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000;

const UNIQUE_FIELD_MESSAGES: Record<string, string> = {
  phoneNumber: "Nomor telepon sudah terdaftar",
  NIS: "NIS sudah terdaftar",
  NIP: "NIP sudah terdaftar",
  email: "Email sudah terdaftar",
};

const handleUniqueConstraintError = (error: unknown): never => {
  if (error instanceof UniqueConstraintError) {
    const field = error.errors[0]?.path ?? "field";
    const message = UNIQUE_FIELD_MESSAGES[field] ?? `${field} sudah terdaftar`;
    throw { status: 409, message };
  }
  throw error;
};

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

class AuthService {      
  public register = async (input: RegisterInput): Promise<{ user: { id: string; email: string; isActive: boolean; role: SystemRoleEnum } }> => {

    const hashedPassword = await bcryptjs.hash(input.password, BCRYPT_SALT_ROUNDS);

    const existingEmail = await User.findOne({ where: { email: input.email } });
    if (existingEmail) throw { status: 409, message: "Email sudah terdaftar" };

    await this.validateProfileUniqueness(input.role, input.phoneNumber, input.NIS, input.NIP);

    const systemRole = await this.findOrCreateRole(input.role);

    let userId: string;

    await sequelize.transaction(async (t: Transaction) => {
      const user = await User.create(
        {
          email: input.email,
          password: hashedPassword,
          isActive: false,
          authProvider: AuthProviderEnum.LOCAL,
        },
        { transaction: t },
      );

      userId = user.id;

      await SystemUserRole.create(
        { userId: user.id, systemRoleId: systemRole.id },
        { transaction: t },
      );

      await this.createProfile(user.id, input, t);
    }).catch(handleUniqueConstraintError);

    await MagicLinkToken.update(
      { isUsed: true },
      { where: { email: input.email, isUsed: false, purpose: MagicLinkPurposeEnum.ACTIVATION } },
    );

    const token = generateMagicLinkToken();
    await MagicLinkToken.create({
      email: input.email,
      token,
      purpose: MagicLinkPurposeEnum.ACTIVATION,
      expiresAt: new Date(Date.now() + MAGIC_LINK_EXPIRY_MS),
    });

    await sendActivationEmail(input.email, token);

    return {
      user: {
        id: userId!,
        email: input.email,
        isActive: false,
        role: input.role,
      },
    };
  };
      
  public login = async (input: LoginInput): Promise<AuthResponse> => {
    const user = await User.scope("withPassword").findOne({
      where: { email: input.email },
    });

    if (!user) {
      throw { status: 401, message: "Email atau password salah" };
    }

    if (!user.isActive) {
      throw { status: 403, message: "Akun belum aktif. Silakan cek email untuk aktivasi akun." };
    }

    if (!user.password) {
      throw {
        status: 400,
        message: "Akun ini terdaftar melalui Google. Silakan gunakan metode login yang sesuai.",
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
      isActive: user.isActive,
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
      
  public getGoogleAuthUrl = (redirectUri: string): string => {
    return googleClient.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      redirect_uri: redirectUri,
      prompt: "consent",
    });
  };
          
  public googleCallback = async (
    input: GoogleCallbackInput,
  ): Promise<
    | { isNewUser: false; auth: AuthResponse }
    | { isNewUser: true; tempToken: string; googleProfile: GoogleTempPayload }
  > => {    
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
    
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw { status: 400, message: "Data Google tidak valid" };
    }
    
    let user = await User.findOne({
      where: {
        [Op.or]: [{ email: payload.email }, { googleId: payload.sub }],
      },
    });

    if (!user) {            
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
      isActive: user.isActive,
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
        
  public googleCompleteProfile = async (
    input: GoogleCompleteProfileInput,
  ): Promise<AuthResponse> => {    
    let googleData: GoogleTempPayload;
    try {
      googleData = verifyGoogleTempToken(input.tempToken);
    } catch {
      throw {
        status: 401,
        message: "Token tidak valid atau sudah kedaluwarsa. Silakan ulangi proses Google login.",
      };
    }
    
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: googleData.email }, { googleId: googleData.googleId }],
      },
    });
    if (existingUser) throw { status: 409, message: "Akun sudah terdaftar. Silakan login." };

    await this.validateProfileUniqueness(
      input.role,
      input.phoneNumber || "",
      input.NIS,
      input.NIP,
    );

    const systemRole = await this.findOrCreateRole(input.role);

    let createdUserId: string;

    await sequelize.transaction(async (t: Transaction) => {
      const user = await User.create(
        {
          email: googleData.email,
          password: null,
          isActive: true,
          authProvider: AuthProviderEnum.GOOGLE,
          googleId: googleData.googleId,
        },
        { transaction: t },
      );

      createdUserId = user.id;

      await SystemUserRole.create(
        { userId: user.id, systemRoleId: systemRole.id },
        { transaction: t },
      );

      await this.createProfile(
        user.id,
        {
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
        },
        t,
      );
    }).catch(handleUniqueConstraintError);

    const { role, profile } = await this.getUserRoleAndProfile(createdUserId!);

    const jwtPayload: JwtPayload = {
      userId: createdUserId!,
      email: googleData.email,
      isActive: true,
      role,
    };
    const tokens = generateTokenPair(jwtPayload);

    await this.storeRefreshToken(createdUserId!, tokens.refreshToken);

    return {
      user: {
        id: createdUserId!,
        email: googleData.email,
        isActive: true,
        role,
        profile,
      },
      tokens,
    };
  };
      
  public verifyActivation = async (input: MagicLinkVerifyInput): Promise<AuthResponse> => {
    const magicLinkToken = await MagicLinkToken.findOne({
      where: { token: input.token, isUsed: false, purpose: MagicLinkPurposeEnum.ACTIVATION },
    });

    if (!magicLinkToken) {
      throw { status: 400, message: "Token tidak valid atau sudah digunakan" };
    }

    if (magicLinkToken.isExpired()) {
      throw { status: 400, message: "Token sudah kedaluwarsa. Silakan request ulang aktivasi." };
    }
    
    magicLinkToken.isUsed = true;
    await magicLinkToken.save();

    const user = await User.findOne({ where: { email: magicLinkToken.email } });
    if (!user) {
      throw { status: 404, message: "User tidak ditemukan" };
    }

    if (user.isActive) {
      throw { status: 400, message: "Akun sudah aktif. Silakan login." };
    }

    await User.update({ isActive: true }, { where: { id: user.id } });

    const { role, profile } = await this.getUserRoleAndProfile(user.id);

    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      isActive: true,
      role,
    };
    const tokens = generateTokenPair(jwtPayload);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        isActive: true,
        role,
        profile,
      },
      tokens,
    };
  };

  public resendActivation = async (email: string): Promise<void> => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Silent return for security
      return;
    }

    if (user.isActive) {
      throw { status: 400, message: "Akun sudah aktif. Silakan login." };
    }

    await MagicLinkToken.update(
      { isUsed: true },
      { where: { email, isUsed: false, purpose: MagicLinkPurposeEnum.ACTIVATION } },
    );

    const token = generateMagicLinkToken();
    await MagicLinkToken.create({
      email,
      token,
      purpose: MagicLinkPurposeEnum.ACTIVATION,
      expiresAt: new Date(Date.now() + MAGIC_LINK_EXPIRY_MS),
    });

    await sendActivationEmail(email, token);
  };

  public forgotPassword = async (input: ForgotPasswordInput): Promise<void> => {
    const user = await User.findOne({ where: { email: input.email } });
    if (!user) {
      // Silent return for security - don't reveal if email exists
      return;
    }

    if (!user.isActive) {
      throw { status: 403, message: "Akun belum aktif. Silakan aktivasi akun terlebih dahulu." };
    }

    if (user.authProvider === AuthProviderEnum.GOOGLE && !user.password) {
      throw { status: 400, message: "Akun ini terdaftar melalui Google. Silakan gunakan metode login Google." };
    }

    await MagicLinkToken.update(
      { isUsed: true },
      { where: { email: input.email, isUsed: false, purpose: MagicLinkPurposeEnum.FORGOT_PASSWORD } },
    );

    const token = generateMagicLinkToken();
    await MagicLinkToken.create({
      email: input.email,
      token,
      purpose: MagicLinkPurposeEnum.FORGOT_PASSWORD,
      expiresAt: new Date(Date.now() + MAGIC_LINK_EXPIRY_MS),
    });

    await sendForgotPasswordEmail(input.email, token);
  };

  public verifyForgotPassword = async (input: MagicLinkVerifyInput): Promise<{ resetToken: string }> => {
    const magicLinkToken = await MagicLinkToken.findOne({
      where: { token: input.token, isUsed: false, purpose: MagicLinkPurposeEnum.FORGOT_PASSWORD },
    });

    if (!magicLinkToken) {
      throw { status: 400, message: "Token tidak valid atau sudah digunakan" };
    }

    if (magicLinkToken.isExpired()) {
      throw { status: 400, message: "Token sudah kedaluwarsa. Silakan request ulang." };
    }

    magicLinkToken.isUsed = true;
    await magicLinkToken.save();

    const user = await User.findOne({ where: { email: magicLinkToken.email } });
    if (!user) {
      throw { status: 404, message: "User tidak ditemukan" };
    }

    const resetToken = generateResetPasswordToken({ userId: user.id, email: user.email });

    return { resetToken };
  };

  public resetPassword = async (input: ResetPasswordInput): Promise<void> => {
    let decoded: { userId: string; email: string };
    try {
      decoded = verifyResetPasswordToken(input.token);
    } catch {
      throw { status: 401, message: "Token reset password tidak valid atau sudah kedaluwarsa" };
    }

    const user = await User.scope("withPassword").findOne({ where: { id: decoded.userId } });
    if (!user) {
      throw { status: 404, message: "User tidak ditemukan" };
    }

    const hashedPassword = await bcryptjs.hash(input.newPassword, BCRYPT_SALT_ROUNDS);
    await User.update({ password: hashedPassword }, { where: { id: user.id } });

    await RefreshToken.destroy({ where: { userId: user.id } });
  };
      
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
    
    await storedToken.destroy();
    
    const { role } = await this.getUserRoleAndProfile(decoded.userId);

    const newPayload: JwtPayload = {
      userId: decoded.userId,
      email: decoded.email,
      isActive: decoded.isActive,
      role,
    };
    const tokens = generateTokenPair(newPayload);

    await this.storeRefreshToken(decoded.userId, tokens.refreshToken);

    return tokens;
  };
      
  public logout = async (userId: string, refreshToken?: string): Promise<void> => {
    if (refreshToken) {      
      await RefreshToken.destroy({
        where: { userId, token: refreshToken },
      });
    } else {      
      await RefreshToken.destroy({ where: { userId } });
    }
  };
      
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
      

  private validateProfileUniqueness = async (
    role: SystemRoleEnum,
    phoneNumber: string,
    NIS?: string,
    NIP?: string,
  ): Promise<void> => {
    if (phoneNumber) {
      const phoneExists =
        role === SystemRoleEnum.STUDENT
          ? await Student.findOne({ where: { phoneNumber } })
          : role === SystemRoleEnum.TEACHER
            ? await Teacher.findOne({ where: { phoneNumber } })
            : await Parent.findOne({ where: { phoneNumber } });
      if (phoneExists) throw { status: 409, message: "Nomor telepon sudah terdaftar" };
    }

    if (NIS && role === SystemRoleEnum.STUDENT) {
      const existing = await Student.findOne({ where: { NIS } });
      if (existing) throw { status: 409, message: "NIS sudah terdaftar" };
    }

    if (NIP && role === SystemRoleEnum.TEACHER) {
      const existing = await Teacher.findOne({ where: { NIP } });
      if (existing) throw { status: 409, message: "NIP sudah terdaftar" };
    }
  };

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
    transaction?: Transaction,
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
        const student = await Student.create(
          {
            ...profileData,
            NIS: input.NIS || null,
            schoolId: input.schoolId || "01",
            schoolName: input.schoolName || "MTsN Model Banda Aceh",
          },
          { transaction },
        );
        return student.toJSON() as unknown as Record<string, unknown>;
      }
      case SystemRoleEnum.TEACHER: {
        const teacher = await Teacher.create(
          {
            ...profileData,
            NIP: input.NIP || null,
            schoolId: input.schoolId || "01",
            schoolName: input.schoolName || "MTsN Model Banda Aceh",
          },
          { transaction },
        );
        return teacher.toJSON() as unknown as Record<string, unknown>;
      }
      case SystemRoleEnum.PARENT: {
        const parent = await Parent.create(profileData, { transaction });
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
    
    await RefreshToken.destroy({
      where: {
        userId,
        expiresAt: { [Op.lt]: new Date() },
      },
    });
  };
}

export default new AuthService();
