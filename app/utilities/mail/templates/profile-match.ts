import { baseTemplate } from "./base";

function Text(matchedUserName: string, instagramUsername: string) {
    return `
It's a Match! - Tinker

Congratulations! You've matched with ${matchedUserName} on Tinker!

You can now reach out to ${matchedUserName} on Instagram:
@${instagramUsername}

Don't be shy - send them a message and start the conversation!

Happy connecting!
— Team Tinker
`;
}

function HTML(matchedUserName: string, instagramUsername: string) {
    return baseTemplate({
        title: "It's a Match! - Tinker",
        body: `
            <!-- Match celebration icon/emoji -->
            <div style="text-align: center; margin: 0 0 20px 0;">
                <span style="font-size: 64px; line-height: 1;">🎉</span>
            </div>
            
            <!-- Greeting -->
            <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 700; color: #E91E63; line-height: 1.3; text-align: center;" class="dark-mode-text">
                It's a Match!
            </h1>
            
            <h2 style="margin: 0 0 30px 0; font-size: 20px; font-weight: 500; color: #4a4a4a; line-height: 1.3; text-align: center;" class="dark-mode-secondary-text">
                You and ${matchedUserName} liked each other
            </h2>
            
            <!-- Body text -->
            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #4a4a4a; text-align: center;" class="dark-mode-secondary-text">
                Congratulations! You've both swiped right. Now's your chance to make a connection!
            </p>
            
            <!-- Instagram card -->
            <div style="background-color: #f9f9f9; border-radius: 12px; padding: 24px; margin: 0 0 30px 0; border: 2px solid #E91E63;">
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #888888; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
                    Connect on Instagram
                </p>
                
                <p style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #E91E63; text-align: center;">
                    @${instagramUsername}
                </p>
                
                <!-- Call-to-action button -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
                    <tr>
                        <td style="border-radius: 8px; background: linear-gradient(45deg, #833AB4, #E91E63, #FCAF45);">
                            <a href="https://instagram.com/${instagramUsername}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                                Open Instagram
                            </a>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Encouragement text -->
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #4a4a4a; text-align: center;" class="dark-mode-secondary-text">
                Don't be shy! Send them a message and see where things go. 💬
            </p>
            
            <!-- Tip box -->
            <div style="margin: 0; padding: 20px; background-color: #FFF3E0; border-left: 4px solid #FF9800; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #E65100;">
                    💡 Pro Tip:
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6D4C41;">
                    Start with a genuine compliment or ask about something from their profile. Authentic conversations lead to real connections!
                </p>
            </div>
    `,
    });
}

export const matchNotificationEmailTemplate = {
    subject: "It's a Match! 🎉 - Tinker",
    text: Text,
    html: HTML,
}