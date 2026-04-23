jest.mock("../../../utils", () => {
  const ActualApiError = class ApiError extends Error {
    constructor(statusCode, message) {
      super(message);
      this.statusCode = statusCode;
    }
  };
  return {
    ApiError: ActualApiError,
    sendAccountVerificationEmail: jest.fn(),
  };
});

jest.mock("../../../utils/logger", () => ({
  logger: { error: jest.fn() },
}));

jest.mock("../students-repository", () => ({
  findStudentById: jest.fn(),
  findAllStudents: jest.fn(),
  findStudentDetail: jest.fn(),
  findStudentToSetStatus: jest.fn(),
  addOrUpdateStudent: jest.fn(),
  removeStudentById: jest.fn(),
}));

const { sendAccountVerificationEmail } = require("../../../utils");
const { logger } = require("../../../utils/logger");
const {
  findStudentById,
  findAllStudents,
  findStudentDetail,
  findStudentToSetStatus,
  addOrUpdateStudent,
  removeStudentById,
} = require("../students-repository");
const { ApiError } = require("../../../utils");

const {
  getAllStudents,
  getStudentDetail,
  addNewStudent,
  updateStudent,
  setStudentStatus,
  deleteStudent,
} = require("../students-service");

describe("students-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllStudents", () => {
    it("returns an empty array when no rows match", async () => {
      findAllStudents.mockResolvedValue([]);

      const out = await getAllStudents({});

      expect(out).toEqual([]);
    });

    it("returns rows from the repository", async () => {
      const rows = [{ id: 1, name: "A" }];
      findAllStudents.mockResolvedValue(rows);

      const out = await getAllStudents({ name: "A" });

      expect(out).toEqual(rows);
      expect(findAllStudents).toHaveBeenCalledWith({ name: "A" });
    });
  });

  describe("getStudentDetail", () => {
    it("throws 404 when the id is not a student", async () => {
      findStudentById.mockResolvedValue(undefined);

      await expect(getStudentDetail("99")).rejects.toMatchObject({
        statusCode: 404,
        message: "Student not found",
      });
      expect(findStudentDetail).not.toHaveBeenCalled();
    });

    it("throws 404 when detail query returns no row", async () => {
      findStudentById.mockResolvedValue({ id: 1 });
      findStudentDetail.mockResolvedValue(undefined);

      await expect(getStudentDetail("1")).rejects.toMatchObject({
        statusCode: 404,
        message: "Student not found",
      });
    });

    it("returns student detail when present", async () => {
      const detail = { id: "1", name: "B" };
      findStudentById.mockResolvedValue({ id: 1 });
      findStudentDetail.mockResolvedValue(detail);

      const out = await getStudentDetail("1");

      expect(out).toEqual(detail);
    });
  });

  describe("addNewStudent", () => {
    it("returns success when insert succeeds and email sends", async () => {
      addOrUpdateStudent.mockResolvedValue({
        status: true,
        userId: 42,
        message: "ok",
      });
      sendAccountVerificationEmail.mockResolvedValue(undefined);

      const out = await addNewStudent({ email: "n@x.com", name: "N" });

      expect(out.message).toContain("verification email sent successfully");
      expect(sendAccountVerificationEmail).toHaveBeenCalledWith({
        userId: 42,
        userEmail: "n@x.com",
      });
    });

    it("returns partial success when email send fails", async () => {
      addOrUpdateStudent.mockResolvedValue({
        status: true,
        userId: 5,
        message: "ok",
      });
      sendAccountVerificationEmail.mockRejectedValue(new Error("smtp down"));

      const out = await addNewStudent({ email: "n@x.com" });

      expect(out.message).toContain("failed to send verification email");
    });

    it("throws 400 when addOrUpdate reports failure", async () => {
      addOrUpdateStudent.mockResolvedValue({
        status: false,
        message: "duplicate",
        description: "email",
      });

      await expect(addNewStudent({})).rejects.toMatchObject({
        statusCode: 400,
        message: "duplicate: email",
      });
    });

    it("re-throws ApiError from addOrUpdate path", async () => {
      addOrUpdateStudent.mockRejectedValue(new ApiError(400, "bad"));

      await expect(addNewStudent({})).rejects.toMatchObject({
        statusCode: 400,
        message: "bad",
      });
    });

    it("maps unexpected errors to 500", async () => {
      addOrUpdateStudent.mockRejectedValue(new Error("db"));

      await expect(addNewStudent({})).rejects.toMatchObject({
        statusCode: 500,
        message: "Unable to add student",
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("updateStudent", () => {
    it("throws 400 when userId is missing", async () => {
      await expect(updateStudent({ name: "x" })).rejects.toMatchObject({
        statusCode: 400,
        message: "Student id is required",
      });
    });

    it("throws 404 when student does not exist", async () => {
      findStudentById.mockResolvedValue(undefined);

      await expect(
        updateStudent({ userId: "1", name: "x" }),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(addOrUpdateStudent).not.toHaveBeenCalled();
    });

    it("returns message when update succeeds", async () => {
      findStudentById.mockResolvedValue({ id: 1 });
      addOrUpdateStudent.mockResolvedValue({
        status: true,
        message: "Student updated successfully",
      });

      const out = await updateStudent({ userId: "1", name: "X" });

      expect(out).toEqual({ message: "Student updated successfully" });
      expect(addOrUpdateStudent).toHaveBeenCalledWith({
        userId: "1",
        name: "X",
      });
    });

    it("throws 400 when update reports failure", async () => {
      findStudentById.mockResolvedValue({ id: 1 });
      addOrUpdateStudent.mockResolvedValue({
        status: false,
        message: "nope",
      });

      await expect(updateStudent({ userId: "1" })).rejects.toMatchObject({
        statusCode: 400,
        message: "nope",
      });
    });
  });

  describe("setStudentStatus", () => {
    it("returns success when rows are updated", async () => {
      findStudentById.mockResolvedValue({ id: "2" });
      findStudentToSetStatus.mockResolvedValue(1);

      const out = await setStudentStatus({
        userId: "2",
        reviewerId: "9",
        status: false,
      });

      expect(out.message).toContain("changed successfully");
    });

    it("throws when student is missing", async () => {
      findStudentById.mockResolvedValue(undefined);

      await expect(
        setStudentStatus({ userId: "1", reviewerId: "9", status: true }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("throws when no row was updated", async () => {
      findStudentById.mockResolvedValue({ id: "1" });
      findStudentToSetStatus.mockResolvedValue(0);

      await expect(
        setStudentStatus({ userId: "1", reviewerId: "9", status: true }),
      ).rejects.toMatchObject({
        statusCode: 500,
        message: "Unable to update student status",
      });
    });
  });

  describe("deleteStudent", () => {
    it("returns success when delete removes a row", async () => {
      findStudentById.mockResolvedValue({ id: "3" });
      removeStudentById.mockResolvedValue(1);

      const out = await deleteStudent({ userId: "3" });

      expect(out.message).toContain("deleted successfully");
      expect(removeStudentById).toHaveBeenCalledWith("3");
    });

    it("throws when student is missing", async () => {
      findStudentById.mockResolvedValue(undefined);

      await expect(deleteStudent({ userId: "1" })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("throws when delete affects no rows", async () => {
      findStudentById.mockResolvedValue({ id: "1" });
      removeStudentById.mockResolvedValue(0);

      await expect(deleteStudent({ userId: "1" })).rejects.toMatchObject({
        statusCode: 500,
        message: "Unable to delete student",
      });
    });
  });
});
