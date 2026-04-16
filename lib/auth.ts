import {betterAuth} from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import {nextCookies} from "better-auth/next-js";
import {prisma} from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {provider: "postgresql"}),
  user: {
    fields: {
      // Mapea el 'name' que Better Auth genera al 'full_name' de tu DB
      name: "full_name",
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // Email verification configuration
  // emailVerification: {
  //   sendOnSignUp: true,
  //   autoSignInAfterVerification: true,
  //   sendVerificationEmail: async ({user, url}) => {
  //     const html = await render(
  //       VerificationAndResetPasswordEmail({name: user.name, url: url, isPasswordReset: false})
  //     );
  //
  //     await resend.emails.send({
  //       from: "Levely <contacto@joinlevely.com>",
  //       to: user.email,
  //       subject: "Verifica tu cuenta en Levely",
  //       html: html,
  //     });
  //   },
  // },

  // Password reset configuration
  // passwordReset: {
  //   sendResetPasswordEmail: async ({user, url}) => {
  //     const html = await render(
  //       VerificationAndResetPasswordEmail({name: user.name, url: url, isPasswordReset: true})
  //     );
  //
  //     await resend.emails.send({
  //       from: "Levely <contacto@joinlevely.com>",
  //       to: user.email,
  //       subject: "Restablece tu contraseña de Levely",
  //       html: html,
  //     });
  //   },
  // },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Actualizar sesión cada día
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutos de cache para mejorar rendimiento
    }
  },

  secret: process.env.BETTER_AUTH_SECRET!,

  // Configuración de proveedores sociales (OAuth)
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //     disableImplicitSignUp: true,
  //   },
  // },

  plugins: [
    nextCookies(),
  ],

  trustedOrigins: [
    process.env.BETTER_AUTH_URL!
  ]
});
