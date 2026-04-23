const asyncHandler = require("express-async-handler");
const {
  getAllStudents,
  addNewStudent,
  getStudentDetail,
  setStudentStatus,
  updateStudent,
  deleteStudent,
} = require("./students-service");

const handleGetAllStudents = asyncHandler(async (req, res) => {
  const { name, className, class: classFromQuery, section, roll } = req.query;
  const students = await getAllStudents({
    name,
    className: className || classFromQuery,
    section,
    roll,
  });
  res.json({ students });
});

const handleAddStudent = asyncHandler(async (req, res) => {
  const message = await addNewStudent(req.body);
  res.json(message);
});

const handleUpdateStudent = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;
  const message = await updateStudent({ ...req.body, userId });
  res.json(message);
});

const handleGetStudentDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await getStudentDetail(id);
  res.json(student);
});

const handleStudentStatus = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;
  const { id: reviewerId } = req.user;
  const message = await setStudentStatus({ ...req.body, userId, reviewerId });
  res.json(message);
});

const handleDeleteStudent = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;
  const message = await deleteStudent({ userId });
  res.json(message);
});

module.exports = {
  handleGetAllStudents,
  handleGetStudentDetail,
  handleAddStudent,
  handleStudentStatus,
  handleUpdateStudent,
  handleDeleteStudent,
};
