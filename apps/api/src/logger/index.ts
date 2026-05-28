import {
  configureSync,
  getConsoleSink,
  getLogger,
  type LogLevel,
} from "@logtape/logtape";

export const useLogger = (category: string[] = ["api"]) => {
  const logger = getLogger(category);
  return logger;
};

// Specialized loggers for different parts of the application
export const useWebhookLogger = () => useLogger(["api", "webhook"]);
export const useStripeLogger = () => useLogger(["api", "stripe"]);
export const useCoupontoolsLogger = () => useLogger(["api", "coupontools"]);
export const useTrackdeskLogger = () => useLogger(["api", "trackdesk"]);
export const useAuthLogger = () => useLogger(["api", "auth"]);
export const useDatabaseLogger = () => useLogger(["api", "database"]);

export function createLogger() {
  const logLevel = (process.env.LOG_LEVEL || "info") as LogLevel;
  const isProduction = process.env.NODE_ENV === "production";

  configureSync({
    sinks: {
      console: getConsoleSink(),
    },
    loggers: [
      // Main API logger
      {
        category: "api",
        lowestLevel: logLevel,
        sinks: ["console"],
      },
      // Webhook logger (always log at info level for audit trail)
      {
        category: ["api", "webhook"],
        lowestLevel: "info",
        sinks: ["console"],
      },
      // Integration loggers
      {
        category: ["api", "stripe"],
        lowestLevel: logLevel,
        sinks: ["console"],
      },
      {
        category: ["api", "coupontools"],
        lowestLevel: logLevel,
        sinks: ["console"],
      },
      {
        category: ["api", "trackdesk"],
        lowestLevel: logLevel,
        sinks: ["console"],
      },
      // Auth logger
      {
        category: ["api", "auth"],
        lowestLevel: isProduction ? "warning" : "debug",
        sinks: ["console"],
      },
      // Database logger
      {
        category: ["api", "database"],
        lowestLevel: isProduction ? "warning" : "info",
        sinks: ["console"],
      },
    ],
  });
}
