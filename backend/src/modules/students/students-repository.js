const { processDBRequest } = require("../../utils");

const STUDENT_ROLE_ID = 3;

const getRoleId = async (roleName) => {
  const query = "SELECT id FROM roles WHERE name ILIKE $1";
  const queryParams = [roleName];
  const { rows } = await processDBRequest({ query, queryParams });
  return rows[0]?.id;
};

const findStudentById = async (id) => {
  const query = `
        SELECT u.id, u.email, u.name, u.role_id, u.is_active AS "isActive"
        FROM users u
        WHERE u.id = $1 AND u.role_id = $2`;
  const queryParams = [id, STUDENT_ROLE_ID];
  const { rows } = await processDBRequest({ query, queryParams });
  return rows[0];
};

const findAllStudents = async (payload) => {
  const { name, className, section, roll } = payload;
  let query = `
        SELECT
            t1.id,
            t1.name,
            t1.email,
            t1.last_login AS "lastLogin",
            t1.is_active AS "systemAccess"
        FROM users t1
        LEFT JOIN user_profiles t3 ON t1.id = t3.user_id
        WHERE t1.role_id = ${STUDENT_ROLE_ID}`;
  const queryParams = [];
  if (name) {
    query += ` AND t1.name ILIKE $${queryParams.length + 1}`;
    queryParams.push(`%${name}%`);
  }
  if (className) {
    query += ` AND t3.class_name = $${queryParams.length + 1}`;
    queryParams.push(className);
  }
  if (section) {
    query += ` AND t3.section_name = $${queryParams.length + 1}`;
    queryParams.push(section);
  }
  if (roll !== undefined && roll !== null && roll !== "") {
    query += ` AND t3.roll::text = $${queryParams.length + 1}`;
    queryParams.push(String(roll));
  }

  query += " ORDER BY t1.id";

  const { rows } = await processDBRequest({ query, queryParams });
  return rows;
};

const addOrUpdateStudent = async (payload) => {
  const query = "SELECT * FROM student_add_update($1::jsonb)";
  const queryParams = [JSON.stringify(payload)];
  const { rows } = await processDBRequest({ query, queryParams });
  const row = rows[0];
  if (!row) {
    return {
      userId: null,
      status: false,
      message: "Empty result from student_add_update",
    };
  }
  return {
    userId: row.userId ?? row.userid,
    status: row.status,
    message: row.message,
    description: row.description,
  };
};

const findStudentDetail = async (id) => {
  const query = `
        SELECT
            u.id,
            u.name,
            u.email,
            u.is_active AS "systemAccess",
            p.phone,
            p.gender,
            p.dob,
            p.class_name AS "class",
            p.section_name AS "section",
            p.roll,
            p.father_name AS "fatherName",
            p.father_phone AS "fatherPhone",
            p.mother_name AS "motherName",
            p.mother_phone AS "motherPhone",
            p.guardian_name AS "guardianName",
            p.guardian_phone AS "guardianPhone",
            p.relation_of_guardian AS "relationOfGuardian",
            p.current_address AS "currentAddress",
            p.permanent_address AS "permanentAddress",
            p.admission_dt AS "admissionDate",
            r.name AS "reporterName"
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN users r ON u.reporter_id = r.id
        WHERE u.id = $1 AND u.role_id = $2`;
  const queryParams = [id, STUDENT_ROLE_ID];
  const { rows } = await processDBRequest({ query, queryParams });
  return rows[0];
};

const findStudentToSetStatus = async ({ userId, reviewerId, status }) => {
  const now = new Date();
  const query = `
        UPDATE users
        SET
            is_active = $1,
            status_last_reviewed_dt = $2,
            status_last_reviewer_id = $3
        WHERE id = $4 AND role_id = $5`;
  const queryParams = [status, now, reviewerId, userId, STUDENT_ROLE_ID];
  const { rowCount } = await processDBRequest({ query, queryParams });
  return rowCount;
};

const removeStudentById = async (userId) => {
  const query = `DELETE FROM users WHERE id = $1 AND role_id = $2`;
  const queryParams = [userId, STUDENT_ROLE_ID];
  const { rowCount } = await processDBRequest({ query, queryParams });
  return rowCount;
};

module.exports = {
  STUDENT_ROLE_ID,
  getRoleId,
  findStudentById,
  findAllStudents,
  addOrUpdateStudent,
  findStudentDetail,
  findStudentToSetStatus,
  removeStudentById,
};
