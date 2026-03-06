import db from '../config/database.js';

export const getAllConfigs = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM system_config ORDER BY config_type, config_key');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateConfig = async (req, res) => {
  try {
    const { config_value } = req.body;
    await db.query(
      'UPDATE system_config SET config_value = $1, updated_by = $2 WHERE config_key = $3',
      [config_value, req.user.id, req.params.key]
    );
    res.json({ message: 'Configuration updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
