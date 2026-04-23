jest.mock("../../../utils", () => {
  class MockApiError extends Error {
    constructor(statusCode, message) {
      super(message);
      this.statusCode = statusCode;
    }
  }

  return {
    ApiError: MockApiError,
    sendAccountVerificationEmail: jest.fn(),
  };
});

jest.mock("../students-repository", () => ({
  findAllStudents: jest.fn(),
  findStudentDetail: jest.fn(),
  findStudentToSetStatus: jest.fn(),
  addOrUpdateStudent: jest.fn(),
  removeStudentById: jest.fn(),
}));

jest.mock("../../../shared/repository", () => ({
  findUserById: jest.fn(),
}));

const { sendAccountVerificationEmail, ApiError } = require("../../../utils");
const {
  findAllStudents,
  findStudentDetail,
  findStudentToSetStatus,
  addOrUpdateStudent,
  removeStudentById,
} = require("../students-repository");
const { findUserById } = require("../../../shared/repository");

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

  it("returns students list when records exist", async () => {
    findAllStudents.mockResolvedValue([{ id: 1 }]);
    const out = await getAllStudents({ name: "A" });
    expect(out).toEqual([{ id: 1 }]);
  });

  it("throws 404 when students list is empty", async () => {
    findAllStudents.mockResolvedValue([]);
    await expect(getAllStudents({})).rejects.toMatchObject({
      statusCode: 404,
      message: "Students not found",
    });
  });

  it("returns student details for an existing student", async () => {
    findUserById.mockResolvedValue({ id: 1 });
    findStudentDetail.mockResolvedValue({ id: 1, name: "Alice" });
    const out = await getStudentDetail(1);
    expect(out).toEqual({ id: 1, name: "Alice" });
  });

  it("throws 404 when student id is not found", async () => {
    findUserById.mockResolvedValue(null);
    await expect(getStudentDetail(10)).rejects.toMatchObject({
      statusCode: 404,
      message: "Student not found",
    });
  });

  it("returns success message when add and email send succeed", async () => {
    addOrUpdateStudent.mockResolvedValue({
      status: true,
      userId: 7,
      message: "ok",
    });
    sendAccountVerificationEmail.mockResolvedValue(true);
    const out = await addNewStudent({ email: "test@mail.com" });
    expect(out.message).toContain("verification email sent successfully");
  });

  it("returns fallback message when add succeeds but email fails", async () => {
    addOrUpdateStudent.mockResolvedValue({
      status: true,
      userId: 7,
      message: "ok",
    });
    sendAccountVerificationEmail.mockRejectedValue(new Error("smtp down"));
    const out = await addNewStudent({ email: "test@mail.com" });
    expect(out.message).toContain("failed to send verification email");
  });

  it("returns DB message when add returns unsuccessful status", async () => {
    addOrUpdateStudent.mockResolvedValue({
      status: false,
      message: "db issue",
    });
    await expect(addNewStudent({})).rejects.toMatchObject({
      statusCode: 500,
      message: "db issue",
    });
  });

  it("returns update message when update succeeds", async () => {
    addOrUpdateStudent.mockResolvedValue({
      status: true,
      message: "Student updated successfully",
    });
    const out = await updateStudent({ userId: 1, name: "Updated" });
    expect(out).toEqual({ message: "Student updated successfully" });
  });

  it("throws when update operation fails", async () => {
    addOrUpdateStudent.mockResolvedValue({
      status: false,
      message: "Unable to update student",
    });
    await expect(updateStudent({ userId: 1 })).rejects.toMatchObject({
      statusCode: 500,
      message: "Unable to update student",
    });
  });

  it("updates status when student exists and repository updates row", async () => {
    findUserById.mockResolvedValue({ id: 4 });
    findStudentToSetStatus.mockResolvedValue(1);
    const out = await setStudentStatus({
      userId: 4,
      reviewerId: 1,
      status: false,
    });
    expect(out).toEqual({ message: "Student status changed successfully" });
  });

  it("throws status update error when no row is updated", async () => {
    findUserById.mockResolvedValue({ id: 4 });
    findStudentToSetStatus.mockResolvedValue(0);
    await expect(
      setStudentStatus({ userId: 4, reviewerId: 1, status: false }),
    ).rejects.toMatchObject({
      statusCode: 500,
      message: "Unable to disable student",
    });
  });

  it("deletes student when record exists", async () => {
    findUserById.mockResolvedValue({ id: 5 });
    removeStudentById.mockResolvedValue(1);
    const out = await deleteStudent({ userId: 5 });
    expect(out).toEqual({ message: "Student deleted successfully" });
  });

  it("throws delete error when no rows are removed", async () => {
    findUserById.mockResolvedValue({ id: 5 });
    removeStudentById.mockResolvedValue(0);
    await expect(deleteStudent({ userId: 5 })).rejects.toMatchObject({
      statusCode: 500,
      message: "Unable to delete student",
    });
  });

  it("re-throws explicit ApiError during add", async () => {
    addOrUpdateStudent.mockRejectedValue(new ApiError(400, "bad input"));
    await expect(addNewStudent({})).rejects.toMatchObject({
      statusCode: 400,
      message: "bad input",
    });
  });
});
