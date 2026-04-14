/**
 * RUTA: src/modules/auth/dto/auth.dto.ts
 */
import {
  IsEmail, IsNotEmpty, IsString,
  Length, MinLength, IsOptional,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  // Compatibilidad App Android
  @IsEmail()
  @IsOptional()
  correo?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  contrasena?: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

/**
 * Solo App Android (Plan Premium).
 * Actualiza el token FCM para push notifications.
 */
export class UpdateFcmTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}
