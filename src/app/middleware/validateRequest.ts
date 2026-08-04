import { NextFunction, Request, Response } from "express";
import z from "zod";

const tryParseJSON = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
  } catch {
    return value;
  }
  return value;
};

const parseBodyFields = (body: Record<string, unknown>): Record<string, unknown> => {
  const parsed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    parsed[key] = tryParseJSON(value);
  }
  return parsed;
};

export const validateRequest = (zodSchema: z.ZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }

    req.body = parseBodyFields(req.body);

    const parsedResult = zodSchema.safeParse(req.body);

    if (!parsedResult.success) {
      return next(parsedResult.error);
    }

    req.body = parsedResult.data;

    next();
  };
};
