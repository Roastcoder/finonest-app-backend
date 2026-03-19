export const toPostgresParams = (obj) => {
  // Filter out null, undefined, and empty string values
  const filteredObj = Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== null && value !== undefined && value !== '')
  );
  const keys = Object.keys(filteredObj);
  const values = Object.values(filteredObj);
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
