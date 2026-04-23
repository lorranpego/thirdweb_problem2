const { z } = require("zod");

const idParam = z.coerce.number().int().positive();

const StudentListQuerySchema = z.object({
  query: z.object({
    name: z.string().optional(),
    className: z.string().optional(),
    class: z.string().optional(),
    section: z.string().optional(),
    roll: z.string().optional(),
  }),
});

const StudentUpsertBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  gender: z.string().min(1, "Gender is required"),
  phone: z.string().min(1, "Phone is required"),
  dob: z.union([z.string(), z.number(), z.date()]),
  currentAddress: z.string().min(1, "Current address is required"),
  permanentAddress: z.string().min(1, "Permanent address is required"),
  fatherName: z.string().min(1, "Father name is required"),
  fatherPhone: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianPhone: z.string().min(1, "Guardian phone is required"),
  relationOfGuardian: z.string().min(1, "Relation of guardian is required"),
  class: z.string().min(1, "Class is required"),
  section: z.string(),
  roll: z.union([z.string(), z.number()]),
  admissionDate: z.union([z.string(), z.number(), z.date()]),
  systemAccess: z.boolean(),
});

const StudentCreateSchema = z.object({
  body: StudentUpsertBodySchema,
});

const StudentUpdateSchema = z.object({
  params: z.object({
    id: idParam,
  }),
  body: StudentUpsertBodySchema,
});

const StudentIdParamSchema = z.object({
  params: z.object({
    id: idParam,
  }),
});

const StudentStatusSchema = z.object({
  params: z.object({
    id: idParam,
  }),
  body: z.object({
    status: z.boolean(),
  }),
});

module.exports = {
  StudentListQuerySchema,
  StudentCreateSchema,
  StudentUpdateSchema,
  StudentIdParamSchema,
  StudentStatusSchema,
};
