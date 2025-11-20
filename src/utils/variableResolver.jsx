// Resolves variables (e.g., {{base_url}}) in a given string
export const resolveVariables = (text, environmentVars) => {
  if (!text || typeof text !== 'string' || !environmentVars) return text;
  let resolvedText = text;
  
  // environmentVars should be a key-value object { base_url: '...', token: '...' }
  for (const [key, value] of Object.entries(environmentVars)) {
    // Regex to match {{ variable_name }} with optional whitespace
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    // Replace with the value (handle case where value might be null/undefined)
    resolvedText = resolvedText.replace(regex, value || '');
  }
  return resolvedText;
};