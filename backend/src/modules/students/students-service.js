const { ApiError, sendAccountVerificationEmail } = require("../../utils");
const { logger } = require("../../utils/logger");
const {
  findStudentById,
  findAllStudents,
  findStudentDetail,
  findStudentToSetStatus,
  addOrUpdateStudent,
  removeStudentById,
} = require("./students-repository");

const ensureStudentExists = async (id) => {
  const row = await findStudentById(id);
  if (!row) {
    throw new ApiError(404, "Student not found");
  }
};

const getAllStudents = async (filters) => findAllStudents(filters);

const getStudentDetail = async (id) => {
  await ensureStudentExists(id);
  const student = await findStudentDetail(id);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }
  return student;
};

const addNewStudent = async (payload) => {
  const ADD_STUDENT_AND_EMAIL_SEND_SUCCESS =
    "Student added and verification email sent successfully.";
  const ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL =
    "Student added, but failed to send verification email.";
  try {
    const result = await addOrUpdateStudent(payload);
    if (!result.status) {
      const detail = result.description ? `: ${result.description}` : "";
      throw new ApiError(400, `${result.message}${detail}`);
    }

    try {
      await sendAccountVerificationEmail({
        userId: result.userId,
        userEmail: payload.email,
      });
      return { message: ADD_STUDENT_AND_EMAIL_SEND_SUCCESS };
    } catch {
      return { message: ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL };
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error("add_new_student_failed", {
      message: error.message,
      stack: error.stack,
    });
    throw new ApiError(500, "Unable to add student");
  }
};

const updateStudent = async (payload) => {
  const { userId } = payload;
  if (userId == null) {
    throw new ApiError(400, "Student id is required");
  }
  await ensureStudentExists(userId);

  const result = await addOrUpdateStudent(payload);
  if (!result.status) {
    const detail = result.description ? `: ${result.description}` : "";
    throw new ApiError(400, `${result.message}${detail}`);
  }

  return { message: result.message };
};

const setStudentStatus = async ({ userId, reviewerId, status }) => {
  await ensureStudentExists(userId);

  const affectedRow = await findStudentToSetStatus({
    userId,
    reviewerId,
    status,
  });
  if (affectedRow <= 0) {
    throw new ApiError(500, "Unable to update student status");
  }

  return { message: "Student status changed successfully" };
};

const deleteStudent = async ({ userId }) => {
  await ensureStudentExists(userId);

  const affectedRow = await removeStudentById(userId);
  if (affectedRow <= 0) {
    throw new ApiError(500, "Unable to delete student");
  }

  return { message: "Student deleted successfully" };
};

module.exports = {
  getAllStudents,
  getStudentDetail,
  addNewStudent,
  setStudentStatus,
  updateStudent,
  deleteStudent,
};
