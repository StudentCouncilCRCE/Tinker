import { resetPasswordEmailTemplate } from "./reset-password";
import { accountVerificationEMailTemplate } from "./verification.account-creation";
import { changeEmailVerificationTemplate } from "./verification.change-email"
import { deleteAccountVerificationTemplate } from "./verification.delete-account";
import { matchNotificationEmailTemplate } from "./profile-match";

export const emailTemplates = {
    accountVerificationEmail: accountVerificationEMailTemplate,
    resetPasswordEmail: resetPasswordEmailTemplate,
    changeEmailVerificationEmail: changeEmailVerificationTemplate,
    deleteAccountVerificationEmail: deleteAccountVerificationTemplate,
    matchNotificationEmail: matchNotificationEmailTemplate,
} as const
