const express = require("express");
const { validateRequest } = require("../../utils");
const studentController = require("./students-controller");
const {
  StudentListQuerySchema,
  StudentCreateSchema,
  StudentUpdateSchema,
  StudentIdParamSchema,
  StudentStatusSchema,
} = require("./students-schemas");

const router = express.Router();

router.get(
  "",
  validateRequest(StudentListQuerySchema),
  studentController.handleGetAllStudents,
);
router.post(
  "",
  validateRequest(StudentCreateSchema),
  studentController.handleAddStudent,
);
router.get(
  "/:id",
  validateRequest(StudentIdParamSchema),
  studentController.handleGetStudentDetail,
);
router.post(
  "/:id/status",
  validateRequest(StudentStatusSchema),
  studentController.handleStudentStatus,
);
router.put(
  "/:id",
  validateRequest(StudentUpdateSchema),
  studentController.handleUpdateStudent,
);
router.delete(
  "/:id",
  validateRequest(StudentIdParamSchema),
  studentController.handleDeleteStudent,
);

module.exports = { studentsRoutes: router };
