export const MAX_FORM_FIELDS = 50;
const CHOICE_TYPES = new Set(['select', 'radio', 'checkbox_group', 'rating']);
const ANSWER_TYPES = new Set(['short_text', 'email', 'phone', 'number', 'long_text', 'select', 'radio', 'checkbox_group', 'boolean_checkbox', 'date', 'rating', 'consent']);

export function fieldIsVisible(field, fields, answers) {
  const rule = field?.visibility;
  if (!rule) return true;
  const sourceIndex = fields.findIndex(item => item.key === rule.field_key);
  const targetIndex = fields.findIndex(item => item.key === field.key);
  if (sourceIndex < 0 || sourceIndex >= targetIndex) return false;
  const value = answers[rule.field_key];
  switch (rule.operator) {
    case 'is_answered': return value !== undefined && value !== '' && value !== false;
    case 'is_not_answered': return value === undefined || value === '' || value === false;
    case 'not_equals': return String(value ?? '') !== String(rule.value ?? '');
    case 'contains_option': return Array.isArray(value) && value.includes(rule.value);
    case 'equals': return String(value ?? '') === String(rule.value ?? '');
    default: return false;
  }
}

function textValue(value, max) {
  return typeof value === 'string' && value.length <= max && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value);
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateCmsFormSubmission(definition, input) {
  const errors = {};
  const answers = {};
  const fields = definition?.fields;
  if (!Array.isArray(fields) || fields.length > MAX_FORM_FIELDS || !input || typeof input !== 'object' || Array.isArray(input)) {
    return { errors: { _form: 'This form is not available. Reload and try again.' }, answers };
  }
  const declared = new Set(fields.filter(field => ANSWER_TYPES.has(field.type)).map(field => field.key));
  for (const key of Object.keys(input)) {
    if (key.startsWith('_') || ['__proto__', 'prototype', 'constructor'].includes(key) || !declared.has(key)) errors[key] = 'This answer is not accepted. Reload the form and try again.';
  }
  for (const field of fields) {
    if (ANSWER_TYPES.has(field.type) && Object.prototype.hasOwnProperty.call(input, field.key) && !fieldIsVisible(field, fields, input)) errors[field.key] = 'This answer is not available for the selected responses.';
  }
  for (const field of fields) {
    if (!ANSWER_TYPES.has(field.type) || !fieldIsVisible(field, fields, { ...input, ...answers })) continue;
    const value = input[field.key];
    if (field.type === 'consent') {
      if (value !== undefined && value !== true && value !== false) errors[field.key] = 'Choose a valid response.';
      if (field.required && value !== true) errors[field.key] = 'Please review and accept this notice.';
      if (value === true) answers[field.key] = true;
      continue;
    }
    if (value === undefined || value === null || value === '') {
      if (field.required) errors[field.key] = 'This field is required.';
      continue;
    }
    const c = field.constraints || {};
    const max = Math.min(Number(c.max_length) || (field.type === 'long_text' ? 3000 : 1000), field.type === 'long_text' ? 3000 : 1000);
    switch (field.type) {
      case 'short_text': case 'long_text':
        if (!textValue(value, max)) errors[field.key] = `Enter text with no more than ${max} characters.`;
        else answers[field.key] = value.trim();
        break;
      case 'email':
        if (!textValue(value, 254) || value.length > (Number(c.max_length) || 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) errors[field.key] = 'Enter a valid email address.';
        else answers[field.key] = value.trim().toLowerCase();
        break;
      case 'phone':
        if (!textValue(value, 40) || !/^\+?[0-9 ()-]{4,40}$/.test(value.trim())) errors[field.key] = 'Enter a valid phone number.';
        else answers[field.key] = value.trim();
        break;
      case 'number': {
        const number = typeof value === 'number' ? value : (typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN);
        if (!Number.isFinite(number) || (c.integer && !Number.isInteger(number)) || (c.min !== undefined && number < Number(c.min)) || (c.max !== undefined && number > Number(c.max))) errors[field.key] = 'Enter a valid number in the allowed range.';
        else answers[field.key] = number;
        break;
      }
      case 'date':
        if (!validDate(value) || (c.min && value < c.min) || (c.max && value > c.max)) errors[field.key] = 'Enter a valid date in the allowed range.';
        else answers[field.key] = value;
        break;
      case 'boolean_checkbox':
        if (typeof value !== 'boolean') errors[field.key] = 'Choose a valid response.';
        else answers[field.key] = value;
        break;
      case 'select': case 'radio': case 'rating': {
        const options = Array.isArray(field.options) && field.options.length ? field.options : field.type === 'rating' ? [1, 2, 3, 4, 5].map(n => ({ value: String(n) })) : [];
        const candidate = String(value);
        if (!options.some(option => String(option.value) === candidate)) errors[field.key] = 'Choose one of the available options.';
        else answers[field.key] = candidate;
        break;
      }
      case 'checkbox_group': {
        const options = Array.isArray(field.options) ? field.options.map(option => String(option.value)) : [];
        const minimum = field.required ? Math.max(1, Number(c.min_selections) || 1) : Number(c.min_selections) || 0;
        const maximum = Math.min(options.length, Number(c.max_selections) || options.length);
        if (!Array.isArray(value) || value.length < minimum || value.length > maximum || new Set(value).size !== value.length || value.some(item => !options.includes(String(item)))) errors[field.key] = 'Choose a valid number of options.';
        else answers[field.key] = value.map(String);
        break;
      }
    }
  }
  return { errors, answers };
}
