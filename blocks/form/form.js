function toBoolean(value) {
  return String(value).trim().toLowerCase() === 'true';
}

function normaliseWidth(value) {
  return String(value).trim().toLowerCase() === 'half' ? 'half' : 'full';
}

function getValue(row, ...keys) {
  if (!row || typeof row !== 'object') return '';

  const matchingKey = Object.keys(row).find((key) => keys.some(
    (expectedKey) => key.toLowerCase() === expectedKey.toLowerCase(),
  ));

  const val = matchingKey ? row[matchingKey] : '';
  return val != null ? val : '';
}

function createFieldWrapper(row) {
  const type = String(getValue(row, 'Type')).trim().toLowerCase();
  if (!type) return null;

  const name = String(getValue(row, 'Name')).trim();
  const labelText = String(getValue(row, 'Label')).trim();
  const placeholder = String(getValue(row, 'Placeholder')).trim();
  const required = toBoolean(getValue(row, 'Required'));
  const width = normaliseWidth(getValue(row, 'Width'));

  const wrapper = document.createElement('div');
  wrapper.className = `form-field form-field-${type} form-field-${width}`;

  if (type === 'content') {
    const paragraph = document.createElement('p');
    paragraph.className = `form-content form-content-${name || 'text'}`;
    paragraph.textContent = placeholder || labelText;
    wrapper.append(paragraph);
    return wrapper;
  }

  if (type === 'submit') {
    const button = document.createElement('button');
    button.className = 'form-submit';
    button.type = 'submit';

    // Store custom endpoint/redirect if authored in Value or Options column
    const actionUrl = getValue(row, 'Value', 'Action', 'Options');
    if (actionUrl) button.dataset.action = actionUrl;

    const buttonText = document.createElement('span');
    buttonText.textContent = labelText || placeholder || 'Submit';

    const arrow = document.createElement('span');
    arrow.className = 'form-submit-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = ' ↗';

    button.append(buttonText, arrow);
    wrapper.append(button);
    return wrapper;
  }

  if (type === 'checkbox') {
    const checkboxLabel = document.createElement('label');
    checkboxLabel.className = 'form-checkbox-label';

    const input = document.createElement('input');
    input.className = 'form-checkbox';
    input.type = 'checkbox';
    input.name = name;
    input.required = required;

    if (required) input.setAttribute('aria-required', 'true');

    const visibleText = document.createElement('span');
    visibleText.className = 'form-checkbox-text';
    visibleText.textContent = placeholder || labelText;

    if (required) {
      const requiredMarker = document.createElement('span');
      requiredMarker.className = 'form-required';
      requiredMarker.setAttribute('aria-hidden', 'true');
      requiredMarker.textContent = ' *';
      visibleText.append(requiredMarker);
    }

    checkboxLabel.append(input, visibleText);
    wrapper.append(checkboxLabel);
    return wrapper;
  }

  const accessibleLabel = document.createElement('label');
  accessibleLabel.className = 'form-label';
  accessibleLabel.htmlFor = `form-${name}`;
  accessibleLabel.textContent = labelText || placeholder;

  if (type === 'select') {
    const select = document.createElement('select');
    select.id = `form-${name}`;
    select.className = 'form-control';
    select.name = name;
    select.required = required;

    if (required) select.setAttribute('aria-required', 'true');

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder || labelText;
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.append(placeholderOption);

    const options = String(getValue(row, 'Options'))
      .split(',')
      .map((option) => option.trim())
      .filter(Boolean);

    options.forEach((optionText) => {
      const option = document.createElement('option');
      option.value = optionText;
      option.textContent = optionText;
      select.append(option);
    });

    wrapper.append(accessibleLabel, select);
    return wrapper;
  }

  const input = type === 'textarea'
    ? document.createElement('textarea')
    : document.createElement('input');

  input.id = `form-${name}`;
  input.className = 'form-control';
  input.name = name;
  input.required = required;
  input.placeholder = placeholder;

  if (required) input.setAttribute('aria-required', 'true');

  if (type === 'textarea') {
    input.rows = 4;
  } else {
    const validTypes = ['email', 'tel', 'number', 'url', 'date', 'password'];
    input.type = validTypes.includes(type) ? type : 'text';
  }

  wrapper.append(accessibleLabel, input);
  return wrapper;
}

function getSpreadsheetPath(block) {
  const link = block.querySelector('a');
  if (link) return new URL(link.href).pathname.replace(/\.json$/, '');

  const value = block.textContent.trim();
  if (!value) return '';

  try {
    return new URL(value, window.location.origin).pathname.replace(/\.json$/, '');
  } catch {
    return value.replace(/\.json$/, '');
  }
}

async function loadFormDefinition(path) {
  const response = await fetch(`${path}.json`);
  if (!response.ok) throw new Error(`Unable to load form definition: ${response.status}`);

  const json = await response.json();

  // Multi-sheet format handling (with config sheet)
  const configSheet = json.config || json.settings;
  const config = {};
  if (configSheet && Array.isArray(configSheet.data)) {
    configSheet.data.forEach((row) => {
      const key = String(row.Key || row.key || '').trim().toLowerCase();
      const val = row.Value || row.value || '';
      if (key) config[key] = val;
    });
  }

  const rows = Array.isArray(json.data) ? json.data : (json.form?.data || json[json[':names']?.[0]]?.data || []);

  return {
    rows,
    action: config.action || json.action || '',
    method: config.method || json.method || 'POST',
    redirect: config.redirect || json.redirect || '/thank-you', // Default incoming page
  };
}

function showStatus(form, message, type) {
  let status = form.querySelector('.form-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.append(status);
  }
  status.className = `form-status form-status-${type}`;
  status.textContent = message;
}

async function submitForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('.form-submit');
  const endpoint = form.dataset.action || submitButton?.dataset.action;
  const redirectUrl = form.dataset.redirect;

  if (!form.reportValidity()) return;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add('submitting');
  }

  try {
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      if (checkbox.name) payload[checkbox.name] = checkbox.checked;
    });

    // 1. Post to backend endpoint if configured
    if (endpoint) {
      const response = await fetch(endpoint, {
        method: form.dataset.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Submission failed: ${response.status}`);
    }

    // 2. SAVE DATA TO SESSION STORAGE FOR THE INCOMING PAGE
    sessionStorage.setItem('submittedFormData', JSON.stringify(payload));

    // 3. REDIRECT TO INCOMING PAGE
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    form.reset();
    showStatus(form, 'Thank you. Your request has been submitted successfully.', 'success');
  } catch {
    showStatus(form, 'We could not submit your request. Please try again.', 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('submitting');
    }
  }
}

export default async function decorate(block) {
  const spreadsheetPath = getSpreadsheetPath(block);

  const container = document.createElement('div');
  container.className = 'contact-form-container';

  const heading = document.createElement('h2');
  heading.className = 'contact-form-heading';
  heading.textContent = 'Contact Us';

  const loading = document.createElement('p');
  loading.className = 'contact-form-loading';
  loading.textContent = 'Loading contact form...';

  container.append(heading, loading);
  block.replaceChildren(container);

  if (!spreadsheetPath) {
    loading.textContent = 'The form spreadsheet path is missing.';
    loading.classList.add('contact-form-error');
    return;
  }

  try {
    const definition = await loadFormDefinition(spreadsheetPath);

    const form = document.createElement('form');
    form.className = 'contact-form';
    form.noValidate = false;
    form.dataset.action = definition.action;
    form.dataset.method = definition.method;
    form.dataset.redirect = definition.redirect;

    const fields = document.createElement('div');
    fields.className = 'contact-form-fields';

    definition.rows.forEach((row) => {
      const field = createFieldWrapper(row);
      if (field) fields.append(field);
    });

    form.append(fields);
    form.addEventListener('submit', submitForm);

    loading.replaceWith(form);
  } catch {
    loading.textContent = 'The contact form could not be loaded.';
    loading.classList.add('contact-form-error');
  }
}
