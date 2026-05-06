import { z } from "zod";

export const performerTypes = ["ATOR", "ATRIZ"] as const;
export type PerformerType = (typeof performerTypes)[number];

export const docTypes = ["RG", "CNH", "PASSAPORTE", "OUTRO"] as const;
export type DocType = (typeof docTypes)[number];

export const createApplicationSchema = z.object({
  performerType: z.enum(performerTypes),

  stageName: z.string().trim().min(2).max(80),
  legalName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  birthDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD"),
  cpf: z.string().trim().max(30).optional().or(z.literal("")),
  nationality: z.string().trim().max(80).optional().or(z.literal("")),

  addressZip: z.string().trim().max(20).optional().or(z.literal("")),
  addressStreet: z.string().trim().max(120).optional().or(z.literal("")),
  addressNumber: z.string().trim().max(20).optional().or(z.literal("")),
  addressComplement: z.string().trim().max(60).optional().or(z.literal("")),
  addressCity: z.string().trim().max(80).optional().or(z.literal("")),
  addressState: z.string().trim().max(40).optional().or(z.literal("")),
  addressCountry: z.string().trim().max(60).optional().or(z.literal("")),

  docType: z.enum(docTypes).optional().or(z.literal("")),
  docNumber: z.string().trim().max(60).optional().or(z.literal("")),
  docIssuer: z.string().trim().max(60).optional().or(z.literal("")),

  consentIsAdult: z.string().transform(v => v === "true" || v === "on" || v === "1"),
  consentPrivacy: z.string().transform(v => v === "true" || v === "on" || v === "1"),
  consentBiometrics: z.string().transform(v => v === "true" || v === "on" || v === "1"),

  faceMatchDistance: z.coerce.number().finite().optional(),
  faceMatchScore: z.coerce.number().finite().optional(),
  faceModel: z.string().trim().max(80).optional().or(z.literal("")),
  selfieDescriptorJson: z.string().trim().optional().or(z.literal("")),
  documentDescriptorJson: z.string().trim().optional().or(z.literal("")),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
