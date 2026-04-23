jest.mock("../students-service", () => ({
  getAllStudents: jest.fn(),
  addNewStudent: jest.fn(),
  getStudentDetail: jest.fn(),
  setStudentStatus: jest.fn(),
  updateStudent: jest.fn(),
  deleteStudent: jest.fn(),
}));

const {
  getAllStudents,
  addNewStudent,
  getStudentDetail,
  setStudentStatus,
  updateStudent,
  deleteStudent,
} = require("../students-service");

const {
  handleGetAllStudents,
  handleGetStudentDetail,
  handleAddStudent,
  handleStudentStatus,
  handleUpdateStudent,
  handleDeleteStudent,
} = require("../students-controller");

const run = (handler, req) =>
  new Promise((resolve, reject) => {
    const res = {
      json: (body) => resolve({ status: 200, body }),
    };
    const next = (err) => (err ? reject(err) : resolve({ status: "next" }));
    const p = handler(req, res, next);
    if (p && typeof p.then === "function") {
      p.catch(reject);
    }
  });

describe("students-controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps GET students query and returns wrapped response", async () => {
    getAllStudents.mockResolvedValue([{ id: 1 }]);
    const result = await run(handleGetAllStudents, {
      query: { name: "john", class: "10", section: "A", roll: "2" },
    });
    expect(getAllStudents).toHaveBeenCalledWith({
      name: "john",
      className: "10",
      section: "A",
      roll: "2",
    });
    expect(result.body).toEqual({ students: [{ id: 1 }] });
  });

  it("prefers className over class in GET query", async () => {
    getAllStudents.mockResolvedValue([]);
    await run(handleGetAllStudents, {
      query: { className: "12", class: "10" },
    });
    expect(getAllStudents).toHaveBeenCalledWith(
      expect.objectContaining({ className: "12" }),
    );
  });

  it("forwards add payload", async () => {
    addNewStudent.mockResolvedValue({ message: "ok" });
    const body = { name: "Alice", email: "alice@demo.com" };
    const result = await run(handleAddStudent, { body });
    expect(addNewStudent).toHaveBeenCalledWith(body);
    expect(result.body).toEqual({ message: "ok" });
  });

  it("uses id param on get detail", async () => {
    getStudentDetail.mockResolvedValue({ id: "5" });
    const result = await run(handleGetStudentDetail, { params: { id: "5" } });
    expect(getStudentDetail).toHaveBeenCalledWith("5");
    expect(result.body).toEqual({ id: "5" });
  });

  it("merges id into update payload", async () => {
    updateStudent.mockResolvedValue({ message: "updated" });
    const result = await run(handleUpdateStudent, {
      params: { id: "7" },
      body: { name: "Bob" },
    });
    expect(updateStudent).toHaveBeenCalledWith({ name: "Bob", userId: "7" });
    expect(result.body).toEqual({ message: "updated" });
  });

  it("merges user and status payload for status endpoint", async () => {
    setStudentStatus.mockResolvedValue({ message: "status updated" });
    const result = await run(handleStudentStatus, {
      params: { id: "4" },
      body: { status: false },
      user: { id: "admin-1" },
    });
    expect(setStudentStatus).toHaveBeenCalledWith({
      status: false,
      userId: "4",
      reviewerId: "admin-1",
    });
    expect(result.body).toEqual({ message: "status updated" });
  });

  it("forwards id for delete endpoint", async () => {
    deleteStudent.mockResolvedValue({ message: "deleted" });
    const result = await run(handleDeleteStudent, { params: { id: "8" } });
    expect(deleteStudent).toHaveBeenCalledWith({ userId: "8" });
    expect(result.body).toEqual({ message: "deleted" });
  });
});
