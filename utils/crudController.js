import { db } from '../config/database.js';

export const createCrudController = (tableName) => {
  return {
    // ✅ GET ALL RECORDS
    index: async (req, res) => {
      const query = `SELECT * FROM ${tableName}`;
      db.all(query, [], (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to fetch records' });
        }
        res.status(200).json(rows);
      });
    },

    // ✅ CREATE RECORD
    store: async (req, res) => {
      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Request body cannot be empty' });
      }
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const placeholders = keys.map(() => '?').join(',');
      

      const insertQuery = `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`;

      db.run(insertQuery, values, function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to create record' });
        }

        const selectQuery = `SELECT * FROM ${tableName} WHERE id = ?`;
        db.get(selectQuery, [this.lastID], (err, row) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch new record' });
          }
          res.status(201).json(row);
        });
      });
    },

    // ✅ SHOW SINGLE RECORD
    show: async (req, res) => {
      const { id } = req.params;
      const query = `SELECT * FROM ${tableName} WHERE id = ?`;

      db.get(query, [id], (err, row) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to fetch record' });
        }
        if (!row) {
          return res.status(404).json({ message: `${tableName} not found` });
        }
        res.status(200).json(row);
      });
    },

    // ✅ UPDATE RECORD
    update: async (req, res) => {
      const { id } = req.params;
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const updates = keys.map((key) => `${key} = ?`).join(', ');

      const checkQuery = `SELECT * FROM ${tableName} WHERE id = ?`;
      db.get(checkQuery, [id], (err, existing) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to check record' });
        }
        if (!existing) {
          return res.status(404).json({ message: `${tableName} not found` });
        }

        const updateQuery = `UPDATE ${tableName} SET ${updates} WHERE id = ?`;
        db.run(updateQuery, [...values, id], function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update record' });
          }

          db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id], (err, row) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to fetch updated record' });
            }
            res.json(row);
          });
        });
      });
    },

    // ✅ DELETE RECORD
    destroy: async (req, res) => {
      const { id } = req.params;

      db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id], (err, existing) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to check record' });
        }
        if (!existing) {
          return res.status(404).json({ message: `${tableName} not found` });
        }

        db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id], function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete record' });
          }
          res.json({ message: `${tableName} deleted successfully` });
        });
      });
    },
  };
};
