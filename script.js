(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Constants and small helpers
   * ------------------------------------------------------------------ */

  const STORE_KEY = 'pawhaven:v1';
  const SPECIES = { Dog: '🐶', Cat: '🐱', Rabbit: '🐰', Bird: '🐦', Other: '🐾' };
  const GENDERS = ['Male', 'Female'];
  const HOMES = ['Apartment', 'House with yard', 'Farm / rural'];
  const ANIMAL_STATUSES = ['Available', 'Pending', 'Adopted'];
  const APP_STATUSES = ['Pending', 'Approved', 'Rejected'];

  const $ = (id) => document.getElementById(id);
  const uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const nowIso = () => new Date().toISOString();
  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

  const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtDateTime = (iso) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const fmtAge = (a) => `${a} ${a === 1 ? 'yr' : 'yrs'}`;

  // Tiny element builder. Text is always added as text nodes, never as HTML.
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  /* ------------------------------------------------------------------ *
   * Data store (kept in localStorage)
   * ------------------------------------------------------------------ */

  function seedData() {
    return {
      animals: [
        { id: 'a1', name: 'Biscuit', species: 'Dog', breed: 'Beagle', age: 3, gender: 'Male', status: 'Available', notes: 'Loves long walks and belly rubs.', added: daysAgo(20) },
        { id: 'a2', name: 'Luna', species: 'Cat', breed: 'Siamese', age: 2, gender: 'Female', status: 'Pending', notes: 'Calm and affectionate. Good with kids.', added: daysAgo(18) },
        { id: 'a3', name: 'Pepper', species: 'Rabbit', breed: 'Dutch', age: 1, gender: 'Female', status: 'Available', notes: 'Shy at first, then very playful.', added: daysAgo(12) },
        { id: 'a4', name: 'Mango', species: 'Bird', breed: 'Cockatiel', age: 4, gender: 'Male', status: 'Available', notes: 'Whistles tunes. Needs a sunny spot.', added: daysAgo(9) },
        { id: 'a5', name: 'Rocky', species: 'Dog', breed: 'Labrador', age: 5, gender: 'Male', status: 'Adopted', notes: 'Fully trained and vaccinated.', added: daysAgo(30) },
        { id: 'a6', name: 'Whiskers', species: 'Cat', breed: 'Tabby', age: 1, gender: 'Male', status: 'Available', notes: 'Energetic. Loves chasing toys.', added: daysAgo(6) },
        { id: 'a7', name: 'Daisy', species: 'Dog', breed: 'Indie', age: 2, gender: 'Female', status: 'Available', notes: 'Rescued from the street. Very loyal.', added: daysAgo(4) },
        { id: 'a8', name: 'Nibbles', species: 'Other', breed: 'Guinea pig', age: 1, gender: 'Female', status: 'Available', notes: 'Squeaks when she hears the fridge.', added: daysAgo(2) },
      ],
      adopters: [
        { id: 'p1', name: 'Asha Verma', email: 'asha.verma@example.com', phone: '98450 11223', home: 'Apartment', added: daysAgo(16) },
        { id: 'p2', name: 'Rahul Nair', email: 'rahul.nair@example.com', phone: '99001 44556', home: 'House with yard', added: daysAgo(28) },
        { id: 'p3', name: 'Meera Iyer', email: 'meera.iyer@example.com', phone: '97311 80990', home: 'Apartment', added: daysAgo(10) },
        { id: 'p4', name: 'Kabir Singh', email: 'kabir.singh@example.com', phone: '98860 33210', home: 'Farm / rural', added: daysAgo(3) },
      ],
      applications: [
        { id: 'r1', animalId: 'a5', adopterId: 'p2', status: 'Approved', note: 'Has a fenced yard and works from home.', created: daysAgo(26), decided: daysAgo(24) },
        { id: 'r2', animalId: 'a6', adopterId: 'p3', status: 'Rejected', note: 'Building does not allow pets.', created: daysAgo(8), decided: daysAgo(7) },
        { id: 'r3', animalId: 'a2', adopterId: 'p1', status: 'Pending', note: 'First-time cat owner, wants a calm cat.', created: daysAgo(1), decided: null },
      ],
      log: [
        { t: daysAgo(24), text: 'Approved: Rocky adopted by Rahul Nair' },
        { t: daysAgo(7), text: 'Rejected: Meera Iyer’s application for Whiskers' },
        { t: daysAgo(2), text: 'Added animal Nibbles' },
        { t: daysAgo(1), text: 'New application: Asha Verma for Luna' },
      ],
    };
  }

  function loadData() {
    try {
      const d = JSON.parse(localStorage.getItem(STORE_KEY));
      if (d && Array.isArray(d.animals) && Array.isArray(d.adopters) && Array.isArray(d.applications) && Array.isArray(d.log)) return d;
    } catch (_) { /* fall through to demo data */ }
    return seedData();
  }

  let db = loadData();

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (_) { /* storage full or blocked: keep working in memory */ }
  }

  const animalById = (id) => db.animals.find((a) => a.id === id);
  const adopterById = (id) => db.adopters.find((a) => a.id === id);
  const appsFor = (key, id) => db.applications.filter((r) => r[key] === id);

  function logIt(text) {
    db.log.unshift({ t: nowIso(), text });
    if (db.log.length > 50) db.log.length = 50;
  }

  /* ------------------------------------------------------------------ *
   * Business rules. The animal's status always follows its applications.
   * ------------------------------------------------------------------ */

  function addAnimal(data) {
    const animal = { id: uid(), ...data, status: 'Available', added: nowIso() };
    db.animals.push(animal);
    logIt(`Added animal ${animal.name}`);
    save();
  }

  function updateAnimal(id, data) {
    Object.assign(animalById(id), data);
    logIt(`Updated animal ${data.name}`);
    save();
  }

  function deleteAnimal(id) {
    const animal = animalById(id);
    if (appsFor('animalId', id).length) {
      toast(`${animal.name} has adoption records and can't be deleted.`, 'error');
      return;
    }
    db.animals = db.animals.filter((a) => a.id !== id);
    logIt(`Removed animal ${animal.name}`);
    save();
    toast(`${animal.name} was removed.`);
  }

  function addAdopter(data) {
    db.adopters.push({ id: uid(), ...data, added: nowIso() });
    logIt(`Registered adopter ${data.name}`);
    save();
  }

  function updateAdopter(id, data) {
    Object.assign(adopterById(id), data);
    logIt(`Updated adopter ${data.name}`);
    save();
  }

  function deleteAdopter(id) {
    const adopter = adopterById(id);
    if (appsFor('adopterId', id).length) {
      toast(`${adopter.name} has applications and can't be deleted.`, 'error');
      return;
    }
    db.adopters = db.adopters.filter((a) => a.id !== id);
    logIt(`Removed adopter ${adopter.name}`);
    save();
    toast(`${adopter.name} was removed.`);
  }

  function createApplication({ animalId, adopterId, note }) {
    const animal = animalById(animalId);
    const adopter = adopterById(adopterId);
    if (!animal || !adopter || animal.status !== 'Available') {
      toast('That animal is no longer available.', 'error');
      return false;
    }
    db.applications.push({ id: uid(), animalId, adopterId, status: 'Pending', note, created: nowIso(), decided: null });
    animal.status = 'Pending';
    logIt(`New application: ${adopter.name} for ${animal.name}`);
    save();
    return true;
  }

  function decideApplication(id, decision) {
    const app = db.applications.find((r) => r.id === id);
    if (!app || app.status !== 'Pending') return;
    const animal = animalById(app.animalId);
    const adopter = adopterById(app.adopterId);
    app.status = decision;
    app.decided = nowIso();
    if (decision === 'Approved') {
      animal.status = 'Adopted';
      logIt(`Approved: ${animal.name} adopted by ${adopter.name}`);
    } else {
      animal.status = 'Available';
      logIt(`Rejected: ${adopter.name}’s application for ${animal.name}`);
    }
    save();
    toast(decision === 'Approved' ? `${animal.name} has a new home!` : 'Application rejected.');
  }

  /* ------------------------------------------------------------------ *
   * Dialogs, toasts
   * ------------------------------------------------------------------ */

  const formDlg = $('formDlg');
  const form = $('form');
  const confirmDlg = $('confirmDlg');

  function toast(text, kind) {
    const el = h('div', { class: 'toast' + (kind === 'error' ? ' error' : '') }, text);
    $('toasts').append(el);
    setTimeout(() => el.remove(), 3500);
  }

  function confirmBox(title, text, okLabel) {
    $('confirmTitle').textContent = title;
    $('confirmText').textContent = text;
    $('confirmOk').textContent = okLabel;
    confirmDlg.returnValue = '';
    return new Promise((resolve) => {
      confirmDlg.addEventListener('close', () => resolve(confirmDlg.returnValue === 'ok'), { once: true });
      confirmDlg.showModal();
    });
  }

  /**
   * Opens the shared form dialog.
   * fields: [{ name, label, type, options, required, validate, half }]
   * onSubmit gets the cleaned values and returns false to keep the dialog open.
   */
  function openForm({ title, submitLabel, fields, values = {}, onSubmit }) {
    $('formTitle').textContent = title;
    $('formSubmit').textContent = submitLabel;
    const body = $('formBody');
    body.replaceChildren();

    const inputs = {};
    const errors = {};
    let rowBuffer = [];

    const flushRow = () => {
      if (rowBuffer.length) body.append(h('div', { class: 'row2' }, rowBuffer));
      rowBuffer = [];
    };

    for (const f of fields) {
      const id = 'f_' + f.name;
      let input;
      if (f.type === 'select') {
        input = h('select', { id, name: f.name },
          h('option', { value: '' }, 'Choose…'),
          f.options.map((o) => h('option', { value: o.value ?? o }, o.label ?? o)));
      } else if (f.type === 'textarea') {
        input = h('textarea', { id, name: f.name, maxlength: f.maxlength });
      } else {
        input = h('input', { id, name: f.name, type: f.type || 'text', min: f.min, max: f.max, step: f.step, maxlength: f.maxlength, autocomplete: 'off' });
      }
      input.value = values[f.name] ?? '';
      input.setAttribute('aria-describedby', id + '_err');
      const err = h('div', { class: 'err', id: id + '_err' });
      inputs[f.name] = input;
      errors[f.name] = err;
      const field = h('div', { class: 'field' }, h('label', { for: id }, f.label + (f.required ? ' *' : '')), input, err);
      if (f.half) {
        rowBuffer.push(field);
        if (rowBuffer.length === 2) flushRow();
      } else {
        flushRow();
        body.append(field);
      }
    }
    flushRow();

    form.onsubmit = (e) => {
      e.preventDefault();
      const data = {};
      let firstBad = null;
      for (const f of fields) {
        const raw = inputs[f.name].value.trim();
        let msg = '';
        if (f.required && !raw) msg = `${f.label} is required.`;
        else if (raw && f.validate) msg = f.validate(raw) || '';
        errors[f.name].textContent = msg;
        inputs[f.name].setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg && !firstBad) firstBad = inputs[f.name];
        data[f.name] = f.type === 'number' && raw !== '' ? Number(raw) : raw;
      }
      if (firstBad) { firstBad.focus(); return; }
      if (onSubmit(data) === false) return;
      formDlg.close();
      render();
    };

    formDlg.showModal();
    const first = body.querySelector('input, select, textarea');
    if (first) first.focus();
  }

  $('formCancel').addEventListener('click', () => formDlg.close());

  /* ------------------------------------------------------------------ *
   * Forms for each record type
   * ------------------------------------------------------------------ */

  function animalForm(animal) {
    openForm({
      title: animal ? `Edit ${animal.name}` : 'Add an animal',
      submitLabel: animal ? 'Save changes' : 'Add animal',
      values: animal || { species: 'Dog', gender: 'Male', age: 1 },
      fields: [
        { name: 'name', label: 'Name', required: true, maxlength: 30 },
        { name: 'species', label: 'Species', type: 'select', options: Object.keys(SPECIES), required: true, half: true },
        { name: 'breed', label: 'Breed', required: true, maxlength: 30, half: true },
        { name: 'age', label: 'Age (years)', type: 'number', min: 0, max: 30, step: 0.5, required: true, half: true,
          validate: (v) => (Number(v) < 0 || Number(v) > 30 ? 'Enter an age between 0 and 30.' : '') },
        { name: 'gender', label: 'Gender', type: 'select', options: GENDERS, required: true, half: true },
        { name: 'notes', label: 'Notes', type: 'textarea', maxlength: 200 },
      ],
      onSubmit: (data) => {
        if (animal) updateAnimal(animal.id, data);
        else addAnimal(data);
        toast(animal ? 'Changes saved.' : `${data.name} was added.`);
      },
    });
  }

  function adopterForm(adopter) {
    openForm({
      title: adopter ? `Edit ${adopter.name}` : 'Register an adopter',
      submitLabel: adopter ? 'Save changes' : 'Register',
      values: adopter || { home: 'Apartment' },
      fields: [
        { name: 'name', label: 'Full name', required: true, maxlength: 60 },
        { name: 'email', label: 'Email', type: 'email', required: true, maxlength: 80,
          validate: (v) => {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
            const dup = db.adopters.find((a) => a.email.toLowerCase() === v.toLowerCase() && (!adopter || a.id !== adopter.id));
            return dup ? 'Another adopter already uses this email.' : '';
          } },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, maxlength: 20, half: true,
          validate: (v) => (/^[0-9+()\-\s]{7,15}$/.test(v) ? '' : 'Enter 7 to 15 digits.') },
        { name: 'home', label: 'Home type', type: 'select', options: HOMES, required: true, half: true },
      ],
      onSubmit: (data) => {
        if (adopter) updateAdopter(adopter.id, data);
        else addAdopter(data);
        toast(adopter ? 'Changes saved.' : `${data.name} was registered.`);
      },
    });
  }

  function applicationForm(presetAnimalId) {
    const available = db.animals.filter((a) => a.status === 'Available');
    if (!available.length) { toast('No animals are available right now.', 'error'); return; }
    if (!db.adopters.length) { toast('Register an adopter first.', 'error'); location.hash = '#adopters'; return; }
    openForm({
      title: 'New adoption application',
      submitLabel: 'Submit application',
      values: { animalId: presetAnimalId || '' },
      fields: [
        { name: 'animalId', label: 'Animal', type: 'select', required: true,
          options: available.map((a) => ({ value: a.id, label: `${SPECIES[a.species]} ${a.name} (${a.breed})` })) },
        { name: 'adopterId', label: 'Adopter', type: 'select', required: true,
          options: db.adopters.map((p) => ({ value: p.id, label: p.name })) },
        { name: 'note', label: 'Notes', type: 'textarea', maxlength: 200 },
      ],
      onSubmit: (data) => {
        if (!createApplication(data)) return false;
        toast('Application submitted.');
      },
    });
  }

  /* ------------------------------------------------------------------ *
   * Views
   * ------------------------------------------------------------------ */

  const ui = {
    animals: { q: '', species: '', status: '', sort: 'newest' },
    adopters: { q: '' },
    applications: { status: '' },
  };

  const badge = (status) => h('span', { class: 'badge ' + status }, status);
  const pageHead = (title, sub, ...actions) =>
    h('div', { class: 'page-head' }, h('div', null, h('h2', null, title), h('p', null, sub)), actions);

  function selectOf(options, value, label, onChange) {
    return h('select', { 'aria-label': label, onchange: (e) => onChange(e.target.value) },
      h('option', { value: '' }, label),
      options.map((o) => h('option', { value: o, selected: o === value }, o)));
  }

  function dashboardView() {
    const count = (s) => db.animals.filter((a) => a.status === s).length;
    const pendingApps = db.applications.filter((r) => r.status === 'Pending').length;
    const total = db.animals.length;
    const rate = total ? Math.round((count('Adopted') / total) * 100) : 0;

    const stats = [
      ['Animals in shelter', total - count('Adopted'), ''],
      ['Available to adopt', count('Available'), ''],
      ['Pending applications', pendingApps, pendingApps ? 'warn' : ''],
      ['Adopted so far', count('Adopted'), ''],
      ['Adoption rate', rate + '%', ''],
    ];

    const maxSpecies = Math.max(1, ...Object.keys(SPECIES).map((s) => db.animals.filter((a) => a.species === s).length));

    return h('section', null,
      pageHead('Dashboard', 'A quick look at the shelter today.'),
      h('div', { class: 'stats' }, stats.map(([lbl, num, cls]) =>
        h('div', { class: 'stat ' + cls }, h('div', { class: 'num' }, num), h('div', { class: 'lbl' }, lbl)))),
      h('div', { class: 'panels' },
        h('div', { class: 'panel' }, h('h3', null, 'Animals by species'),
          h('div', { class: 'bars' }, Object.keys(SPECIES).map((s) => {
            const n = db.animals.filter((a) => a.species === s).length;
            return h('div', { class: 'bar-row' },
              h('span', null, `${SPECIES[s]} ${s}`),
              h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill', style: `width:${n ? (n / maxSpecies) * 100 : 0}%` })),
              h('span', { class: 'n' }, n));
          }))),
        h('div', { class: 'panel' }, h('h3', null, 'Recent activity'),
          db.log.length
            ? h('ul', { class: 'log' }, db.log.slice(0, 8).map((e) => h('li', null, h('span', null, e.text), h('time', { datetime: e.t }, fmtDateTime(e.t)))))
            : h('p', { class: 'meta' }, 'Nothing has happened yet.'))));
  }

  function animalsView() {
    const st = ui.animals;
    const grid = h('div', { class: 'grid' });

    const fill = () => {
      const q = st.q.trim().toLowerCase();
      let list = db.animals.filter((a) =>
        (!q || `${a.name} ${a.breed}`.toLowerCase().includes(q)) &&
        (!st.species || a.species === st.species) &&
        (!st.status || a.status === st.status));
      list.sort((a, b) => (st.sort === 'name' ? a.name.localeCompare(b.name)
        : st.sort === 'age' ? a.age - b.age
        : b.added.localeCompare(a.added)));

      grid.replaceChildren(...(list.length ? list.map(animalCard)
        : [h('div', { class: 'empty' }, db.animals.length ? 'No animals match your filters.' : 'No animals yet. Add the first one!')]));
    };

    const toolbar = h('div', { class: 'toolbar' },
      h('input', { type: 'search', placeholder: 'Search by name or breed', 'aria-label': 'Search animals', value: st.q,
        oninput: (e) => { st.q = e.target.value; fill(); } }),
      selectOf(Object.keys(SPECIES), st.species, 'All species', (v) => { st.species = v; fill(); }),
      selectOf(ANIMAL_STATUSES, st.status, 'All statuses', (v) => { st.status = v; fill(); }),
      h('select', { 'aria-label': 'Sort animals', onchange: (e) => { st.sort = e.target.value; fill(); } },
        [['newest', 'Newest first'], ['name', 'Name A–Z'], ['age', 'Youngest first']].map(([v, l]) => h('option', { value: v, selected: v === st.sort }, l))),
      h('button', { class: 'btn primary', type: 'button', onclick: () => animalForm() }, '+ Add animal'));

    fill();
    return h('section', null, pageHead('Animals', 'Everyone currently in our care.'), toolbar, grid);
  }

  function animalCard(a) {
    const remove = async () => {
      if (await confirmBox(`Remove ${a.name}?`, 'This deletes the animal record. It cannot be undone.', 'Remove')) {
        deleteAnimal(a.id);
        render();
      }
    };
    return h('article', { class: 'card' },
      h('div', { class: 'avatar sp-' + a.species.toLowerCase(), 'aria-hidden': 'true' }, SPECIES[a.species]),
      h('div', { class: 'card-body' },
        h('h3', null, a.name, badge(a.status)),
        h('p', { class: 'meta' }, `${a.breed} · ${fmtAge(a.age)} · ${a.gender}`),
        a.notes ? h('p', { class: 'notes' }, a.notes) : null),
      h('div', { class: 'card-actions' },
        a.status === 'Available'
          ? h('button', { class: 'btn small primary', type: 'button', 'aria-label': `Start adoption for ${a.name}`, onclick: () => applicationForm(a.id) }, 'Adopt')
          : null,
        h('button', { class: 'btn small', type: 'button', 'aria-label': `Edit ${a.name}`, onclick: () => animalForm(a) }, 'Edit'),
        h('button', { class: 'btn small text-danger', type: 'button', 'aria-label': `Remove ${a.name}`, onclick: remove }, 'Remove')));
  }

  function adoptersView() {
    const st = ui.adopters;
    const tbody = h('tbody');

    const fill = () => {
      const q = st.q.trim().toLowerCase();
      const list = db.adopters.filter((p) => !q || `${p.name} ${p.email}`.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));
      tbody.replaceChildren(...(list.length ? list.map(adopterRow)
        : [h('tr', null, h('td', { colspan: 5, class: 'meta' }, db.adopters.length ? 'No adopters match your search.' : 'No adopters registered yet.'))]));
    };

    const toolbar = h('div', { class: 'toolbar' },
      h('input', { type: 'search', placeholder: 'Search by name or email', 'aria-label': 'Search adopters', value: st.q,
        oninput: (e) => { st.q = e.target.value; fill(); } }),
      h('button', { class: 'btn primary', type: 'button', onclick: () => adopterForm() }, '+ Register adopter'));

    fill();
    return h('section', null,
      pageHead('Adopters', 'People who want to give an animal a home.'),
      toolbar,
      h('div', { class: 'table-wrap' }, h('table', null,
        h('thead', null, h('tr', null, ['Name', 'Contact', 'Home', 'Applications', ''].map((t) => h('th', { scope: 'col' }, t)))),
        tbody)));
  }

  function adopterRow(p) {
    const remove = async () => {
      if (await confirmBox(`Remove ${p.name}?`, 'This deletes the adopter record. It cannot be undone.', 'Remove')) {
        deleteAdopter(p.id);
        render();
      }
    };
    return h('tr', null,
      h('td', null, h('strong', null, p.name)),
      h('td', null, p.email, h('span', { class: 'sub' }, p.phone)),
      h('td', null, p.home),
      h('td', null, appsFor('adopterId', p.id).length),
      h('td', { class: 'actions' },
        h('button', { class: 'btn small', type: 'button', 'aria-label': `Edit ${p.name}`, onclick: () => adopterForm(p) }, 'Edit'),
        h('button', { class: 'btn small text-danger', type: 'button', 'aria-label': `Remove ${p.name}`, onclick: remove }, 'Remove')));
  }

  function applicationsView() {
    const st = ui.applications;
    const tbody = h('tbody');

    const fill = () => {
      const list = db.applications.filter((r) => !st.status || r.status === st.status)
        .sort((a, b) => b.created.localeCompare(a.created));
      tbody.replaceChildren(...(list.length ? list.map(applicationRow)
        : [h('tr', null, h('td', { colspan: 5, class: 'meta' }, 'No applications to show.'))]));
    };

    const toolbar = h('div', { class: 'toolbar' },
      selectOf(APP_STATUSES, st.status, 'All statuses', (v) => { st.status = v; fill(); }),
      h('button', { class: 'btn primary', type: 'button', onclick: () => applicationForm() }, '+ New application'));

    fill();
    return h('section', null,
      pageHead('Applications', 'Review requests and approve or decline them.'),
      toolbar,
      h('div', { class: 'table-wrap' }, h('table', null,
        h('thead', null, h('tr', null, ['Animal', 'Adopter', 'Submitted', 'Status', ''].map((t) => h('th', { scope: 'col' }, t)))),
        tbody)));
  }

  function applicationRow(r) {
    const animal = animalById(r.animalId);
    const adopter = adopterById(r.adopterId);
    const decide = async (decision) => {
      const verb = decision === 'Approved' ? 'Approve' : 'Reject';
      const msg = decision === 'Approved'
        ? `${animal.name} will be marked as adopted by ${adopter.name}.`
        : `${animal.name} will become available again.`;
      if (await confirmBox(`${verb} this application?`, msg, verb)) {
        decideApplication(r.id, decision);
        render();
      }
    };
    return h('tr', null,
      h('td', null, h('strong', null, `${SPECIES[animal.species]} ${animal.name}`), h('span', { class: 'sub' }, animal.breed)),
      h('td', null, adopter.name, r.note ? h('span', { class: 'sub' }, r.note) : null),
      h('td', null, fmtDate(r.created)),
      h('td', null, badge(r.status)),
      h('td', { class: 'actions' },
        r.status === 'Pending' ? [
          h('button', { class: 'btn small primary', type: 'button', 'aria-label': `Approve ${adopter.name} for ${animal.name}`, onclick: () => decide('Approved') }, 'Approve'),
          h('button', { class: 'btn small text-danger', type: 'button', 'aria-label': `Reject ${adopter.name} for ${animal.name}`, onclick: () => decide('Rejected') }, 'Reject'),
        ] : null));
  }

  /* ------------------------------------------------------------------ *
   * Router and app chrome
   * ------------------------------------------------------------------ */

  const VIEWS = { dashboard: dashboardView, animals: animalsView, adopters: adoptersView, applications: applicationsView };

  function currentRoute() {
    const r = location.hash.slice(1);
    return VIEWS[r] ? r : 'dashboard';
  }

  function render() {
    const route = currentRoute();
    $('view').replaceChildren(VIEWS[route]());
    document.querySelectorAll('.tabs a').forEach((a) => {
      if (a.dataset.route === route) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = `${route[0].toUpperCase() + route.slice(1)} · PawHaven`;
  }

  window.addEventListener('hashchange', () => {
    render();
    $('view').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  });

  $('btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: `pawhaven-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Data exported.');
  });

  $('btnReset').addEventListener('click', async () => {
    if (await confirmBox('Reset to demo data?', 'All your current records will be replaced by the sample shelter.', 'Reset')) {
      db = seedData();
      save();
      render();
      toast('Demo data restored.');
    }
  });

  render();
})();
