import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { errorHandler } from "./middlewares/error-handler";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check endpoint for friendly browser access
app.get("/", (_req, res) => {
  res.json({
    name: "Security Guard API Server",
    status: "online",
    version: "0.2.0",
    healthCheck: "/api/healthz",
    documentation: "https://github.com/rajditya2411-stack/INBOX-SECURITY",
  });
});

app.use("/api", router);

// Register global Express error handler
app.use(errorHandler);

export default app;
