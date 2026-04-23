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
      return p.then(() => {}).catch(reject);
    }
  });

describe("students-controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET all maps class query alias to className", async () => {
    getAllStudents.mockResolvedValue([{ id: 1 }]);

    const { body } = await run(handleGetAllStudents, {
      query: { class: "10", section: "A" },
    });

    expect(getAllStudents).toHaveBeenCalledWith({
      name: undefined,
      className: "10",
      section: "A",
      roll: undefined,
    });
    expect(body).toEqual({ students: [{ id: 1 }] });
  });

  it("GET all prefers className over class when both provided", async () => {
    getAllStudents.mockResolvedValue([]);

    await run(handleGetAllStudents, {
      query: { className: "Z", class: "10" },
    });

    expect(getAllStudents).toHaveBeenCalledWith(
      expect.objectContaining({ className: "Z" }),
    );
  });

  it("GET detail uses route id", async () => {
    getStudentDetail.mockResolvedValue({ id: "5" });

    const { body } = await run(handleGetStudentDetail, {
      params: { id: "5" },
    });

    expect(getStudentDetail).toHaveBeenCalledWith("5");
    expect(body).toEqual({ id: "5" });
  });

  it("POST create forwards body", async () => {
    addNewStudent.mockResolvedValue({ message: "ok" });

    const { body } = await run(handleAddStudent, {
      body: { name: "N", email: "n@x.com" },
    });

    expect(addNewStudent).toHaveBeenCalledWith({ name: "N", email: "n@x.com" });
    expect(body).toEqual({ message: "ok" });
  });

  it("PUT update merges userId from params", async () => {
    updateStudent.mockResolvedValue({ message: "updated" });

    const { body } = await run(handleUpdateStudent, {
      params: { id: "7" },
      body: { name: "X" },
    });

    expect(updateStudent).toHaveBeenCalledWith({ name: "X", userId: "7" });
    expect(body).toEqual({ message: "updated" });
  });

  it("POST status merges userId and reviewerId", async () => {
    setStudentStatus.mockResolvedValue({ message: "status ok" });

    const { body } = await run(handleStudentStatus, {
      params: { id: "4" },
      body: { status: true },
      user: { id: "admin-1" },
    });

    expect(setStudentStatus).toHaveBeenCalledWith({
      status: true,
      userId: "4",
      reviewerId: "admin-1",
    });
    expect(body).toEqual({ message: "status ok" });
  });

  it("DELETE forwards userId from params", async () => {
    deleteStudent.mockResolvedValue({ message: "gone" });

    const { body } = await run(handleDeleteStudent, {
      params: { id: "8" },
    });

    expect(deleteStudent).toHaveBeenCalledWith({ userId: "8" });
    expect(body).toEqual({ message: "gone" });
  });
});
