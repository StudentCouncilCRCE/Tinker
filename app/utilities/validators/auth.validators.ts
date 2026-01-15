import { PasswordValidationError } from "../errors/validation.errors";

export async function validatePassword(
    password: string | undefined,
    confirmPassword: string | null = null
): Promise<boolean> {
    // Check if password is provided
    if (!password) {
        throw new PasswordValidationError("", "Password is required");
    }

    // Check minimum length
    if (password.length < 8) {
        throw new PasswordValidationError(password, "Password must be at least 8 characters long");
    }

    // Check maximum length (prevent extremely long passwords)
    if (password.length > 128) {
        throw new PasswordValidationError(password, "Password must not exceed 128 characters");
    }

    return true;
}