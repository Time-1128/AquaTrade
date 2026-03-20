const db = require("../config/database");

exports.updateUser = (req, res) => {

  const { name, email } = req.body;

  const query = `
    UPDATE users
    SET name = ?, email = ?
    WHERE id = ?
  `;

  db.query(query, [name, email, req.params.id], (err) => {

    if (err) return res.status(500).json(err);

    res.json({ message: "Profile updated" });

  });

};