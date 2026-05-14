// Options page logic. Vanilla JS, no framework. Persists to chrome.storage.sync
// under the key `filterRules`. Each rule is:
//   { channelName: string | "*", filterType: "shorts" | "minDuration" | "keyword", value }
const RULES_KEY = 'filterRules';

const typeEl = document.getElementById('rule-type');
const numInput = document.getElementById('rule-value-num');
const textInput = document.getElementById('rule-value-text');
const channelInput = document.getElementById('rule-channel');
const addBtn = document.getElementById('add-rule');
const tbody = document.getElementById('rules-body');
const emptyState = document.getElementById('empty-state');
const countEl = document.getElementById('rule-count');

function updateValueInput() {
  const type = typeEl.value;
  numInput.classList.remove('active');
  textInput.classList.remove('active');
  if (type === 'minDuration') numInput.classList.add('active');
  else if (type === 'keyword') textInput.classList.add('active');
  // "shorts" needs no value input
}

typeEl.addEventListener('change', updateValueInput);
updateValueInput();

async function loadRules() {
  const result = await chrome.storage.sync.get([RULES_KEY]);
  return Array.isArray(result[RULES_KEY]) ? result[RULES_KEY] : [];
}

async function saveRules(rules) {
  await chrome.storage.sync.set({ [RULES_KEY]: rules });
}

function describeFilter(rule) {
  switch (rule.filterType) {
    case 'shorts': return 'Hide Shorts';
    case 'minDuration': return 'Shorter than';
    case 'keyword': return 'Title/channel contains';
    default: return rule.filterType;
  }
}

function describeValue(rule) {
  if (rule.filterType === 'shorts') return '—';
  if (rule.filterType === 'minDuration') return `${rule.value} min`;
  return `"${rule.value}"`;
}

async function render() {
  const rules = await loadRules();
  tbody.innerHTML = '';
  countEl.textContent = rules.length;
  if (rules.length === 0) {
    emptyState.style.display = 'block';
    document.getElementById('rules-table').style.display = 'none';
    return;
  }
  emptyState.style.display = 'none';
  document.getElementById('rules-table').style.display = 'table';

  rules.forEach((rule, index) => {
    const tr = document.createElement('tr');

    const tdChannel = document.createElement('td');
    const channelSpan = document.createElement('span');
    channelSpan.className = 'tag';
    channelSpan.textContent = rule.channelName || '*';
    tdChannel.appendChild(channelSpan);

    const tdFilter = document.createElement('td');
    tdFilter.textContent = describeFilter(rule);

    const tdValue = document.createElement('td');
    tdValue.textContent = describeValue(rule);

    const tdAction = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      const current = await loadRules();
      current.splice(index, 1);
      await saveRules(current);
      render();
    });
    tdAction.appendChild(deleteBtn);

    tr.append(tdChannel, tdFilter, tdValue, tdAction);
    tbody.appendChild(tr);
  });
}

addBtn.addEventListener('click', async () => {
  const channelName = (channelInput.value || '*').trim() || '*';
  const filterType = typeEl.value;
  let value = '';
  if (filterType === 'minDuration') {
    const n = parseFloat(numInput.value);
    if (!Number.isFinite(n) || n < 0) {
      alert('Enter a non-negative number of minutes.');
      return;
    }
    value = n;
  } else if (filterType === 'keyword') {
    const k = textInput.value.trim();
    if (!k) {
      alert('Enter a keyword.');
      return;
    }
    value = k;
  }
  const rule = { channelName, filterType, value };
  const current = await loadRules();
  current.push(rule);
  await saveRules(current);
  textInput.value = '';
  render();
});

render();
