const request = require("supertest");
const express = require("express");

jest.mock("../students-controller", () => ({
  handleGetAllStudents: jest.fn((req, res) => res.json({ route: "get-all" })),
  handleAddStudent: jest.fn((req, res) => res.json({ route: "add" })),
  handleGetStudentDetail: jest.fn((req, res) =>
    res.json({ route: "get-detail" }),
  ),
  handleStudentStatus: jest.fn((req, res) => res.json({ route: "status" })),
  handleUpdateStudent: jest.fn((req, res) => res.json({ route: "update" })),
  handleDeleteStudent: jest.fn((req, res) => res.json({ route: "delete" })),
}));

const studentController = require("../students-controller");
const { studentsRoutes } = require("../students-router");

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/students", studentsRoutes);
  return app;
};

describe("students-router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("routes GET /students to handleGetAllStudents", async () => {
    const app = makeApp();
    await request(app).get("/students").expect(200);
    expect(studentController.handleGetAllStudents).toHaveBeenCalled();
  });

  it("routes POST /students to handleAddStudent", async () => {
    const app = makeApp();
    await request(app).post("/students").send({}).expect(200);
    expect(studentController.handleAddStudent).toHaveBeenCalled();
  });

  it("routes GET /students/:id to handleGetStudentDetail", async () => {
    const app = makeApp();
    await request(app).get("/students/1").expect(200);
    expect(studentController.handleGetStudentDetail).toHaveBeenCalled();
  });

  it("routes POST /students/:id/status to handleStudentStatus", async () => {
    const app = makeApp();
    await request(app)
      .post("/students/1/status")
      .send({ status: true })
      .expect(200);
    expect(studentController.handleStudentStatus).toHaveBeenCalled();
  });

  it("routes PUT /students/:id to handleUpdateStudent", async () => {
    const app = makeApp();
    await request(app).put("/students/1").send({}).expect(200);
    expect(studentController.handleUpdateStudent).toHaveBeenCalled();
  });

  it("routes DELETE /students/:id to handleDeleteStudent", async () => {
    const app = makeApp();
    await request(app).delete("/students/1").expect(200);
    expect(studentController.handleDeleteStudent).toHaveBeenCalled();
  });
});
