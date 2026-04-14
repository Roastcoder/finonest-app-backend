import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getAllConfigs = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT sc.*, 
             COALESCE(u.full_name, u.user_id) as updated_by_name
      FROM system_config sc
      LEFT JOIN users u ON sc.updated_by = u.id
      ORDER BY sc.config_type, sc.config_key
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get system configs error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getConfigByKey = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM system_config WHERE config_key = $1',
      [req.params.key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get config by key error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createConfig = async (req, res) => {
  try {
    const { config_key, config_value, config_type, description } = req.body;
    
    if (!config_key || !config_value || !config_type) {
      return res.status(400).json({ 
        error: 'Config key, value, and type are required' 
      });
    }

    const configData = {
      config_key,
      config_value,
      config_type,
      description: description || null,
      updated_by: req.user.id
    };

    const { keys, values, params } = toPostgresParams(configData);
    const result = await db.query(
      `INSERT INTO system_config (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );

    res.status(201).json({
      message: 'Configuration created successfully',
      configId: result.rows[0].id
    });
  } catch (error) {
    console.error('Create config error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Configuration key already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateConfig = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_by: req.user.id,
      updated_at: new Date()
    };

    const { query, values } = buildUpdateQuery('system_config', updateData, req.params.id);
    const result = await db.query(query, values);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json({ message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Update config error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Configuration key already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateConfigByKey = async (req, res) => {
  try {
    const { config_value, description } = req.body;
    const config_key = req.params.key;

    const result = await db.query(
      `UPDATE system_config 
       SET config_value = $1, 
           description = COALESCE($2, description),
           updated_by = $3, 
           updated_at = NOW() 
       WHERE config_key = $4
       RETURNING id`,
      [config_value, description, req.user.id, config_key]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json({ message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Update config by key error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteConfig = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM system_config WHERE id = $1', [req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Delete config error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getConfigsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    const result = await db.query(`
      SELECT sc.*, 
             COALESCE(u.full_name, u.user_id) as updated_by_name
      FROM system_config sc
      LEFT JOIN users u ON sc.updated_by = u.id
      WHERE sc.config_type = $1
      ORDER BY sc.config_key
    `, [type]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get configs by type error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const bulkUpdateConfigs = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const { configs } = req.body;
    
    if (!Array.isArray(configs)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Configs must be an array' });
    }

    const results = [];
    
    for (const config of configs) {
      const { id, config_value, description } = config;
      
      if (!id || config_value === undefined) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Each config must have id and config_value' 
        });
      }

      const updateData = {
        config_value,
        description: description || null,
        updated_by: req.user.id,
        updated_at: new Date()
      };

      const { query, values } = buildUpdateQuery('system_config', updateData, id);
      const result = await client.query(query, values);
      
      results.push({
        id,
        updated: result.rowCount > 0
      });
    }

    await client.query('COMMIT');
    res.json({
      message: 'Configurations updated successfully',
      results
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk update configs error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const resetToDefaults = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Reset to default configurations
    const defaultConfigs = [
      { key: 'company_name', value: 'Finonest', type: 'general', description: 'Company name' },
      { key: 'timezone', value: 'Asia/Kolkata', type: 'general', description: 'System timezone' },
      { key: 'currency', value: 'INR', type: 'general', description: 'System currency' },
      { key: 'session_timeout', value: '30', type: 'general', description: 'Session timeout in minutes' },
      { key: 'max_file_size', value: '10485760', type: 'document', description: 'Max file upload size in bytes (10MB)' },
      { key: 'allowed_file_types', value: 'jpg,jpeg,png,pdf', type: 'document', description: 'Allowed file extensions' }
    ];

    // Clear existing configs
    await client.query('DELETE FROM system_config');

    // Insert default configs
    for (const config of defaultConfigs) {
      await client.query(
        `INSERT INTO system_config (config_key, config_value, config_type, description, updated_by) 
         VALUES ($1, $2, $3, $4, $5)`,
        [config.key, config.value, config.type, config.description, req.user.id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'System configuration reset to defaults successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reset to defaults error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const toggleStageAccess = async (req, res) => {
  const client = await db.connect();
  try {
    const { stage_type, enabled } = req.body;
    
    if (!stage_type || !['lead', 'login'].includes(stage_type)) {
      return res.status(400).json({ error: 'Invalid stage_type. Must be "lead" or "login"' });
    }

    await client.query('BEGIN');
    
    const config_key = `${stage_type}_stage_enabled`;
    const config_value = enabled ? 'true' : 'false';
    const disable_until = enabled ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Store enabled timestamp for login stage
    const enabled_at_key = `${stage_type}_stage_enabled_at`;
    const enabled_at_value = enabled ? new Date().toISOString() : null;
    
    const checkResult = await client.query(
      'SELECT id FROM system_config WHERE config_key = $1',
      [config_key]
    );

    if (checkResult.rows.length > 0) {
      await client.query(
        `UPDATE system_config 
         SET config_value = $1, 
             description = $2,
             updated_by = $3, 
             updated_at = NOW() 
         WHERE config_key = $4`,
        [
          config_value,
          disable_until ? `Disabled until ${disable_until.toISOString()}` : `${stage_type} stage access enabled`,
          req.user.id,
          config_key
        ]
      );
    } else {
      await client.query(
        `INSERT INTO system_config (config_key, config_value, config_type, description, updated_by) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          config_key,
          config_value,
          'stage',
          disable_until ? `Disabled until ${disable_until.toISOString()}` : `${stage_type} stage access enabled`,
          req.user.id
        ]
      );
    }

    // Store/update enabled_at timestamp
    const checkEnabledAtResult = await client.query(
      'SELECT id FROM system_config WHERE config_key = $1',
      [enabled_at_key]
    );

    if (checkEnabledAtResult.rows.length > 0) {
      await client.query(
        `UPDATE system_config 
         SET config_value = $1, 
             updated_by = $2, 
             updated_at = NOW() 
         WHERE config_key = $3`,
        [enabled_at_value || '', req.user.id, enabled_at_key]
      );
    } else if (enabled_at_value) {
      await client.query(
        `INSERT INTO system_config (config_key, config_value, config_type, description, updated_by) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          enabled_at_key,
          enabled_at_value,
          'stage',
          `${stage_type} stage enabled timestamp`,
          req.user.id
        ]
      );
    }

    await client.query('COMMIT');
    
    res.json({
      message: `${stage_type} stage ${enabled ? 'enabled' : 'disabled for 24 hours'}`,
      config_key,
      enabled,
      disable_until,
      enabled_at: enabled_at_value
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Toggle stage access error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};