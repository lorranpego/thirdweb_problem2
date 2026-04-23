jest.mock("../../../utils", () => ({
  processDBRequest: jest.fn(),
}));

const { processDBRequest } = require("../../../utils");
const {
  findAllStudents,
  addOrUpdateStudent,
  findStudentDetail,
  findStudentToSetStatus,
  removeStudentById,
} = require("../students-repository");

describe("students-repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds list query with no filters", async () => {
    processDBRequest.mockResolvedValue({ rows: [{ id: 1 }] });

    const out = await findAllStudents({});

    expect(out).toEqual([{ id: 1 }]);
    const call = processDBRequest.mock.calls[0][0];
    expect(call.query).toContain("WHERE t1.role_id = 3");
    expect(call.queryParams).toEqual([]);
  });

  it("builds list query with all filters in order", async () => {
    processDBRequest.mockResolvedValue({ rows: [] });

    await findAllStudents({
      name: "Alice",
      className: "10",
      section: "A",
      roll: "2",
    });

    const call = processDBRequest.mock.calls[0][0];
    expect(call.query).toContain("AND t1.name = $1");
    expect(call.query).toContain("AND t3.class_name = $2");
    expect(call.query).toContain("AND t3.section_name = $3");
    expect(call.query).toContain("AND t3.roll = $4");
    expect(call.queryParams).toEqual(["Alice", "10", "A", "2"]);
  });

  it("calls stored function for addOrUpdateStudent", async () => {
    processDBRequest.mockResolvedValue({ rows: [{ status: true }] });
    const payload = { name: "New Student" };

    const out = await addOrUpdateStudent(payload);

    expect(out).toEqual({ status: true });
    const call = processDBRequest.mock.calls[0][0];
    expect(call.query).toBe("SELECT * FROM student_add_update($1::jsonb)");
    expect(call.queryParams).toEqual([payload]);
  });

  it("returns first row for student detail", async () => {
    processDBRequest.mockResolvedValue({ rows: [{ id: 10 }] });

    const out = await findStudentDetail(10);

    expect(out).toEqual({ id: 10 });
    const call = processDBRequest.mock.calls[0][0];
    expect(call.query).toContain("WHERE u.id = $1");
    expect(call.queryParams).toEqual([10]);
  });

  it("returns rowCount for status update", async () => {
    processDBRequest.mockResolvedValue({ rowCount: 1 });

    const out = await findStudentToSetStatus({
      userId: 2,
      reviewerId: 9,
      status: false,
    });

    expect(out).toBe(1);
    const call = processDBRequest.mock.calls[0][0];
    expect(call.query).toContain("UPDATE users");
    expect(call.queryParams[0]).toBe(false);
    expect(call.queryParams[2]).toBe(9);
    expect(call.queryParams[3]).toBe(2);
  });

  it("returns rowCount for delete query", async () => {
    processDBRequest.mockResolvedValue({ rowCount: 1 });

    const out = await removeStudentById(7);

    expect(out).toBe(1);
    const call = processDBRequest.mock.calls[0][0];
    expect(call.query).toBe("DELETE FROM users WHERE id = $1");
    expect(call.queryParams).toEqual([7]);
  });
});
