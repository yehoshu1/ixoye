import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import logger from "./logger";

export const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            // Discord now sends an RFC 9207 `iss` parameter on OAuth callbacks.
            // openid-client validates it against the provider's issuer, which the
            // built-in Discord provider leaves unset, so every sign-in fails with
            // "issuer must be configured on the issuer" (OAuthCallback).
            issuer: "https://discord.com",
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            authorization: { params: { scope: "identify guilds" } },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    logger: process.env.NODE_ENV === "development"
        ? {
            error(code, ...message) {
                logger.error(code, ...message);
            },
            warn(code, ...message) {
                logger.warn(code, ...message);
            },
        }
        : undefined,
    callbacks: {
        async signIn() {
            return true;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.sub;
            }
            return session;
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
    },

    pages: {
        signIn: '/auth/signin',
        error: '/auth/signin',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
