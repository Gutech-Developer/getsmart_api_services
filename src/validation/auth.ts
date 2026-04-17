import { z } from "zod";
import { SystemRoleEnum } from "../types/enums";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().pipe(z.email()),
    password: z.string().min(8, "Password minimal 8 karakter"),
    fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
    phoneNumber: z.string().regex(/^\d+$/, "Nomor telepon harus berupa angka"),
    role: z.nativeEnum(SystemRoleEnum, {
      error: "Role harus STUDENT, TEACHER, atau PARENT",
    }).refine(
      (val) => val !== SystemRoleEnum.ADMIN,
      { message: "Registrasi sebagai ADMIN tidak diperbolehkan" },
    ),
    NIS: z.string().optional(),
    NIP: z.string().optional(),
    province: z.string().optional(),
    city: z.string().optional(),
    schoolId: z.string().optional(),
    schoolName: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().pipe(z.email()),
    password: z.string().min(1, "Password wajib diisi"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token wajib diisi"),
  }),
});

export const googleUrlSchema = z.object({
  query: z.object({
    redirectUri: z.string().pipe(z.url("Redirect URI harus berupa URL yang valid")),
  }),
});

export const googleCallbackSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Authorization code wajib diisi"),
    redirectUri: z.string().pipe(z.url("Redirect URI harus berupa URL yang valid")),
  }),
});

export const googleCompleteProfileSchema = z.object({
  body: z.object({
    tempToken: z.string().min(1, "Temporary token wajib diisi"),
    role: z.nativeEnum(SystemRoleEnum, {
      error: "Role harus STUDENT, TEACHER, atau PARENT",
    }).refine(
      (val) => val !== SystemRoleEnum.ADMIN,
      { message: "Registrasi sebagai ADMIN tidak diperbolehkan" },
    ),
    fullName: z.string().min(3, "Nama lengkap minimal 3 karakter").optional(),
    phoneNumber: z.string().regex(/^\d+$/, "Nomor telepon harus berupa angka").optional(),
    NIS: z.string().optional(),
    NIP: z.string().optional(),
    province: z.string().optional(),
    city: z.string().optional(),
    schoolId: z.string().optional(),
    schoolName: z.string().optional(),
  }),
});

export const magicLinkRequestSchema = z.object({
  body: z.object({
    email: z.string().pipe(z.email()),
  }),
});

export const magicLinkVerifySchema = z.object({
  query: z.object({
    token: z.string().min(1, "Token wajib diisi"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().pipe(z.email()),
  }),
});

export const forgotPasswordVerifySchema = z.object({
  query: z.object({
    token: z.string().min(1, "Token wajib diisi"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token wajib diisi"),
    newPassword: z.string().min(8, "Password minimal 8 karakter"),
  }),
});
  