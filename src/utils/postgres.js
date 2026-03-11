export const toPostgresParams = (obj) => {
  const keys = Object.keys(obj);
  const values = Object.values(obj);
  const params = keys.map((_, i) => `$${i + 1}`).join(', ');
  return { keys, values, params };
};

export const buildUpdateQuery = (table, data, id) => {
  const keys = Object.keys(data);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = [...Object.values(data), id];
  return {
    query: `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1}`,
    values
  };
};
