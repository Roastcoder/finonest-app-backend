import pool from '../config/database.js';

export const processChatMessage = async (req, res) => {
  try {
    const { message, userId } = req.body;
    const response = await handleChatQuery(message, userId);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleChatQuery = async (message, userId) => {
  const lowerMessage = message.toLowerCase();
  
  // Find data queries
  if (lowerMessage.includes('find') || lowerMessage.includes('show') || lowerMessage.includes('get')) {
    return await handleFindQuery(lowerMessage);
  }
  
  // Update data queries
  if (lowerMessage.includes('update') || lowerMessage.includes('change') || lowerMessage.includes('modify')) {
    return await handleUpdateQuery(lowerMessage, userId);
  }
  
  // Delete data queries
  if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
    return await handleDeleteQuery(lowerMessage, userId);
  }
  
  return "I can help you find, update, or delete data. Try commands like 'find all loans', 'update loan status', or 'delete lead'.";
};

const handleFindQuery = async (message) => {
  try {
    // Loans queries
    if (message.includes('loan')) {
      if (message.includes('pending')) {
        const result = await pool.query('SELECT * FROM loans WHERE status = $1 LIMIT 10', ['pending']);
        return formatResults('Pending Loans', result.rows);
      }
      if (message.includes('all')) {
        const result = await pool.query('SELECT * FROM loans ORDER BY created_at DESC LIMIT 10');
        return formatResults('Recent Loans', result.rows);
      }
    }
    
    // Leads queries
    if (message.includes('lead')) {
      if (message.includes('new') || message.includes('recent')) {
        const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 10');
        return formatResults('Recent Leads', result.rows);
      }
    }
    
    // Users queries
    if (message.includes('user')) {
      const result = await pool.query('SELECT id, user_id, full_name, role, status FROM users ORDER BY created_at DESC LIMIT 10');
      return formatResults('Users', result.rows);
    }
    
    // Banks queries
    if (message.includes('bank')) {
      const result = await pool.query('SELECT * FROM banks WHERE status = $1', ['active']);
      return formatResults('Active Banks', result.rows);
    }
    
    return "Please specify what you want to find (loans, leads, users, banks).";
  } catch (error) {
    return `Error finding data: ${error.message}`;
  }
};

const handleUpdateQuery = async (message, userId) => {
  try {
    // Extract ID and new value from message
    const idMatch = message.match(/id\s*(\d+)/);
    if (!idMatch) return "Please specify an ID to update (e.g., 'update loan id 123 status to approved')";
    
    const id = idMatch[1];
    
    if (message.includes('loan')) {
      if (message.includes('status')) {
        const statusMatch = message.match(/status\s+to\s+(\w+)/);
        if (!statusMatch) return "Please specify new status (e.g., 'approved', 'rejected')";
        
        const newStatus = statusMatch[1];
        await pool.query('UPDATE loans SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, id]);
        return `Loan ID ${id} status updated to ${newStatus}`;
      }
    }
    
    if (message.includes('lead')) {
      if (message.includes('stage')) {
        const stageMatch = message.match(/stage\s+to\s+(\w+)/);
        if (!stageMatch) return "Please specify new stage";
        
        const newStage = stageMatch[1];
        await pool.query('UPDATE leads SET stage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStage, id]);
        return `Lead ID ${id} stage updated to ${newStage}`;
      }
    }
    
    return "Please specify what to update (loan status, lead stage).";
  } catch (error) {
    return `Error updating data: ${error.message}`;
  }
};

const handleDeleteQuery = async (message, userId) => {
  try {
    const idMatch = message.match(/id\s*(\d+)/);
    if (!idMatch) return "Please specify an ID to delete (e.g., 'delete lead id 123')";
    
    const id = idMatch[1];
    
    if (message.includes('lead')) {
      await pool.query('DELETE FROM leads WHERE id = $1', [id]);
      return `Lead ID ${id} deleted successfully`;
    }
    
    if (message.includes('loan')) {
      return "Loans cannot be deleted for audit purposes. Use update status instead.";
    }
    
    return "Please specify what to delete (lead).";
  } catch (error) {
    return `Error deleting data: ${error.message}`;
  }
};

const formatResults = (title, rows) => {
  if (rows.length === 0) return `No ${title.toLowerCase()} found.`;
  
  let result = `${title} (${rows.length} found):\n\n`;
  rows.forEach((row, index) => {
    result += `${index + 1}. `;
    Object.entries(row).slice(0, 4).forEach(([key, value]) => {
      result += `${key}: ${value || 'N/A'} | `;
    });
    result += '\n';
  });
  
  return result;
};