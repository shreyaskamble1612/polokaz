import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  plugins: [
    inferAdditionalFields({
      user: {
        referralId: {
          type: "string",
          input: true,
          required: false,
        },
        birthdate: {
          type: "date",
          required: true,
          input: true,
        },
        countryName: {
          type: "string",
          required: true,
          input: true,
        },
      },
    }),
    adminClient(),
  ],
});

type ErrorTypes = Partial<
  Record<
    keyof typeof authClient.$ERROR_CODES,
    {
      en: string;
      es: string;
    }
  >
>;

const errorCodes = {
  USER_ALREADY_EXISTS: {
    en: "User already registered",
    es: "Usuario ya registrado",
  },
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: {
    en: "User already exists use another email",
    es: "El usuario ya existe use otro email",
  },
  INVALID_EMAIL_OR_PASSWORD: {
    en: "Invalid email or password",
    es: "Email o contraseña invalida",
  },
} satisfies ErrorTypes;

const getErrorMessage = (code: string, lang: "en" | "es") => {
  if (code in errorCodes) {
    return errorCodes[code as keyof typeof errorCodes][lang];
  }
  return "";
};

export { getErrorMessage };
