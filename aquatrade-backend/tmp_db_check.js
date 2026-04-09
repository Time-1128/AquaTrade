const db = require('./config/database');
db.query('DESCRIBE fish', (err, rows) => {
  if (err) {
    console.error('DB ERROR', err.message || err);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
});
