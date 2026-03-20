const SHEET_ID = '1SlLl2Ly6zqP5_PpQKdhEoefv96_LyCUpf0dRyQfcfAE';

export async function loadPlans() {
  const sheets = await fetchSheets();
  const notes = await fetchNotes();
  const bosses = [
    buildGnarlmoon(sheets['Gnarlmoon'] ?? [], notes),
    buildLeyWatcher(sheets['Ley-Watcher Incantagos'] ?? [], notes),
    buildAnomalus(sheets['Anomalus'] ?? [], notes),
    buildEcho(sheets['Echo of Medivh'] ?? [], notes),
    buildChess(sheets['Chess'] ?? [], notes),
    buildSanv(sheets['Sanv'] ?? [], notes),
    buildRupturan(sheets['Rupturan'] ?? [], notes),
    buildKruul(sheets['Kruul'] ?? [], notes),
    buildMeph(sheets['Mephistroth'] ?? [], notes)
  ];
  return { bosses, karaNotes: notes };
}

async function fetchSheets() {
  const names = [
    'Gnarlmoon',
    'Ley-Watcher Incantagos',
    'Anomalus',
    'Echo of Medivh',
    'Chess',
    'Sanv',
    'Rupturan',
    'Kruul',
    'Mephistroth'
  ];
  const results = {};
  for (const name of names) {
    try {
      results[name] = await fetchSheet(name);
    } catch {
      results[name] = [];
    }
  }
  return results;
}

async function fetchSheet(sheetName) {
  const uri = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Failed to load ${sheetName}`);
  const body = await res.text();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`Bad response for ${sheetName}`);
  const jsonStr = body.slice(start, end + 1);
  const data = JSON.parse(jsonStr);
  const table = data.table || {};
  const rows = (table.rows || []).map((row) => {
    const cells = row.c || [];
    return cells.map((c) => (c == null ? '' : (c.v ?? '').toString()));
  });
  return rows;
}

async function fetchNotes() {
  const uri = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kara40%20Notes`;
  const res = await fetch(uri);
  if (!res.ok) return {};
  const body = await res.text();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1) return {};
  const jsonStr = body.slice(start, end + 1);
  const data = JSON.parse(jsonStr);
  const table = data.table || {};
  const rows = (table.rows || []).map((row) => {
    const cells = row.c || [];
    return cells.map((c) => (c == null ? '' : (c.v ?? '').toString()));
  });

  const noteMap = {};
  for (const r of rows) {
    if (!r.length) continue;
    const title = (r[0] || '').trim();
    const note = (r[1] || '').trim();
    if (!title || !note) continue;
    const key = title.toLowerCase();
    if (!noteMap[key]) noteMap[key] = [];
    noteMap[key].push(`${title}: ${note}`);

    for (const bossKey of [
      'gnarlmoon',
      'ley-watcher incantagos',
      'anomalus',
      'echo of medivh',
      'chess',
      'sanv',
      'rupturan',
      'kruul',
      'mephistroth'
    ]) {
      if (key.includes(bossKey)) {
        if (!noteMap[bossKey]) noteMap[bossKey] = [];
        noteMap[bossKey].push(`${title}: ${note}`);
      }
    }
  }
  return noteMap;
}

function cell(rows, r, c) {
  if (r < 0 || r >= rows.length) return '';
  const row = rows[r] || [];
  if (c < 0 || c >= row.length) return '';
  const val = row[c] ?? '';
  return val === 'null' ? '' : val;
}

function findRow(rows, text) {
  return rows.findIndex((r) => r.some((c) => (c || '').toLowerCase() === text.toLowerCase()));
}

function notesFor(notes, key) {
  return notes[key] ?? [];
}

function notesForContains(notes, keyPart, extraPart) {
  const lowerKey = keyPart.toLowerCase();
  const lowerExtra = extraPart.toLowerCase();
  const collected = [];
  Object.entries(notes).forEach(([k, v]) => {
    const lk = k.toLowerCase();
    if (lk.includes(lowerKey) && lk.includes(lowerExtra)) {
      collected.push(...v);
    }
  });
  return collected;
}

function buildGnarlmoon(rows, notes) {
  const left = [];
  const right = [];
  for (let i = 1; i < rows.length; i += 1) {
    const l = cell(rows, i, 1).trim();
    const r = cell(rows, i, 3).trim();
    if (l) left.push(l);
    if (r) right.push(r);
    if (i > 20 && !l && !r) break;
  }

  const tankHealers = [];
  for (let i = 1; i < 8 && i < rows.length; i += 1) {
    const name = cell(rows, i, 6);
    if (name && name.toLowerCase() !== 'tank healer') {
      tankHealers.push(name);
    }
  }

  const tankCoreLeft = [];
  const tankCoreRight = [];
  for (let i = 23; i <= 24 && i < rows.length; i += 1) {
    const l = cell(rows, i, 1);
    const r = cell(rows, i, 3);
    if (l) tankCoreLeft.push(l);
    if (r) tankCoreRight.push(r);
  }

  return {
    name: 'Gnarlmoon',
    description: 'Left vs Right split. Counts show bodies per side; keep tanks and healers balanced.',
    highlights: [
      `Left target: ${cell(rows, 0, 0)}`,
      `Right target: ${cell(rows, 0, 4)}`,
      ...(tankHealers.length ? [`Tank healers: ${tankHealers.join(', ')}`] : [])
    ],
    tables: [
      {
        title: 'Left Side',
        headers: ['Player'],
        rows: left.map((v) => [v]),
        caption: 'Pulled live from Gnarlmoon sheet (left column).'
      },
      {
        title: 'Right Side',
        headers: ['Player'],
        rows: right.map((v) => [v]),
        caption: 'Pulled live from Gnarlmoon sheet (right column).'
      },
      {
        title: 'Tanks',
        headers: ['Left', 'Right'],
        rows: [[
          tankCoreLeft.length ? tankCoreLeft.join(', ') : '—',
          tankCoreRight.length ? tankCoreRight.join(', ') : '—'
        ]]
      },
      {
        title: 'Tank Healers',
        headers: ['Players'],
        rows: [[tankHealers.join(', ')]]
      }
    ],
    notes: [
      { title: 'Magic', items: ['Dampen Magic on non-tanks.'] },
      ...(notesFor(notes, 'gnarlmoon').length
        ? [{ title: 'Kara notes', items: notesFor(notes, 'gnarlmoon') }]
        : [])
    ],
    imageAsset: '/assets/gnarlmoon.png',
    extraImages: []
  };
}

function buildAnomalus(rows, notes) {
  const healerRows = [];
  const headerRow = findRow(rows, 'Group 1 & 2');
  if (headerRow !== -1) {
    for (let i = headerRow + 1; i < rows.length; i += 1) {
      const isTanksMarker = rows[i]?.length && (rows[i][0] || '').toLowerCase() === 'tanks';
      if (isTanksMarker) break;
      if ((rows[i] || []).every((c) => !c || !c.trim())) continue;
      const filled = Array(5).fill('');
      for (let j = 0; j < 5 && j < rows[i].length; j += 1) {
        filled[j] = rows[i][j];
      }
      healerRows.push(filled);
    }
  }

  const tankAssignments = [];
  const tankHeaderRow = rows.findIndex((r) => r.length && (r[0] || '').trim().toLowerCase() === 'tanks');
  if (tankHeaderRow !== -1) {
    for (let r = tankHeaderRow + 1; r < rows.length; r += 1) {
      const tank = cell(rows, r, 0);
      const order = cell(rows, r, 1);
      if (!tank.trim() && !order.trim()) break;
      if (!tank.trim() && !order.trim()) continue;
      tankAssignments.push([tank, order]);
    }
  }

  const tankHealers = [];
  for (let i = 3; i <= 5 && i < rows.length; i += 1) {
    const healer = cell(rows, i, 4);
    if (healer && healer.toLowerCase() !== 'tanks') tankHealers.push(healer);
  }

  return {
    name: 'Anomalus',
    description: 'Group healing assignments plus tank rotation. Tanks section mirrors the sheet block after group 7 & 8.',
    highlights: [
      'Group 1-4 have dedicated healers',
      'Tanks listed under Group 1 & 2 with positions beside them',
      'Tank healers shown in the Tanks column'
    ],
    tables: [
      {
        title: 'Healer Layout',
        headers: ['Group 1 & 2', 'Group 3 & 4', 'Group 5 & 6', 'Group 7 & 8', 'Tanks'],
        rows: healerRows
      },
      ...(tankAssignments.length
        ? [{
            title: 'Tank Order',
            headers: ['Tank', 'Order'],
            rows: tankAssignments,
            caption: 'Taken from the Tanks block (Nubbie, Sniej, Tijana).'
          }]
        : []),
      ...(tankHealers.length
        ? [{
            title: 'Tank Healers',
            headers: ['Healer', 'Tanks'],
            rows: tankHealers.map((h) => [
              h,
              tankAssignments.length ? tankAssignments.map((t) => t[0]).join(', ') : 'Nubbie, Sniej, Tijana'
            ]),
            caption: 'Healers assigned to tanks (from column next to Group 7 & 8).'
          }]
        : []),
      {
        title: 'Magic',
        headers: ['Call', 'Targets'],
        rows: [['Dampen Magic', 'Non-tanks']]
      }
    ],
    notes: [
      { title: 'Buffs', items: ['Apply Dampen Magic on non-tanks.'] },
      ...(notesFor(notes, 'anomalus').length
        ? [{ title: 'Kara notes', items: notesFor(notes, 'anomalus') }]
        : [])
    ],
    imageAsset: '/assets/anomalus.png',
    extraImages: []
  };
}

function buildChess(rows, notes) {
  function phase(name) {
    const headRow = findRow(rows, name);
    if (headRow === -1) return [];
    const pieceRow = rows[headRow] || [];
    const roleRow = headRow + 1 < rows.length ? rows[headRow + 1] : [];
    let nextPhase = rows.length;
    for (let i = headRow + 1; i < rows.length; i += 1) {
      if ((rows[i] || []).some((c) => c.toString().toLowerCase().includes('phase'))) {
        nextPhase = i;
        break;
      }
    }
    const dataRows = rows.slice(headRow + 2, nextPhase);

    const pieceForCol = {};
    let current = '';
    for (let c = 0; c < pieceRow.length; c += 1) {
      const nameCell = pieceRow[c]?.toString() ?? '';
      if (nameCell.trim()) current = nameCell;
      pieceForCol[c] = current;
    }

    const roles = {};
    for (let c = 0; c < roleRow.length; c += 1) {
      const role = roleRow[c]?.toString() ?? '';
      if (role.trim()) roles[c] = role;
    }

    const collected = {};
    for (const row of dataRows) {
      for (let c = 0; c < row.length; c += 1) {
        const val = row[c]?.toString() ?? '';
        if (!val.trim()) continue;
        const piece = pieceForCol[c] ?? '';
        if (!piece) continue;
        const role = roles[c] ?? 'Extra';
        if (!collected[piece]) collected[piece] = {};
        if (!collected[piece][role]) collected[piece][role] = [];
        collected[piece][role].push(val);
      }
    }

    const data = [];
    Object.entries(collected).forEach(([piece, roleMap]) => {
      const tanks = roleMap['Tank'] ?? [];
      const healers = roleMap['Healer'] ?? [];
      const extras = Object.entries(roleMap)
        .filter(([k]) => k !== 'Tank' && k !== 'Healer')
        .flatMap(([, v]) => v);

      const maxRows = Math.max(tanks.length, healers.length, extras.length);
      const rowsCount = maxRows === 0 ? 1 : maxRows;
      for (let i = 0; i < rowsCount; i += 1) {
        data.push([
          piece,
          i < tanks.length ? tanks[i] : '',
          i < healers.length ? healers[i] : '',
          i < extras.length ? extras[i] : ''
        ]);
      }
    });

    return [{
      title: name,
      headers: ['Piece', 'Tank', 'Healer', 'DPS / Extra'],
      rows: data
    }];
  }

  const p1 = phase('Phase 1');
  const p2 = phase('Phase 2');
  const p3 = phase('Phase 3');

  return {
    name: 'Chess',
    description: 'Phase-by-phase board control with tanks/healers on pieces.',
    highlights: [
      'Three phases mapped from sheet',
      'Dedicated healer per key piece',
      'Dampen Magic on non-tanks only'
    ],
    tables: [
      ...p1,
      ...p2,
      ...p3,
      {
        title: 'Magic',
        headers: ['Call'],
        rows: [['Dampen Magic'], ['Non-tanks only']]
      }
    ],
    notes: [
      ...(notesFor(notes, 'chess').length
        ? [{ title: 'Kara notes', items: notesFor(notes, 'chess') }]
        : [])
    ],
    imageAsset: '/assets/chess.png',
    extraImages: []
  };
}

function buildSanv(rows, notes) {
  return {
    name: "Sanv Tas'dal",
    description: 'Split between boss platform and staircase with backup and portal teams.',
    highlights: [
      `Boss: ${cell(rows, 3, 1)} + ${cell(rows, 3, 2)}`,
      `Staircase: ${cell(rows, 3, 4)} + ${cell(rows, 3, 5)}`
    ],
    tables: [
      {
        title: 'Primary Positions',
        headers: ['Spot', 'Tank', 'Healer'],
        rows: [
          ['Boss', cell(rows, 3, 1), cell(rows, 3, 2)],
          ['Boss backups', cell(rows, 4, 1), cell(rows, 4, 2)]
        ]
      },
      {
        title: 'Staircase',
        headers: ['Spot', 'Tank', 'Healer'],
        rows: [
          ['Staircase', cell(rows, 3, 4), cell(rows, 3, 5)],
          ['Stair backups', cell(rows, 4, 4), cell(rows, 4, 5)],
          ['Stair portal team', cell(rows, 5, 4), cell(rows, 5, 5)]
        ]
      },
      {
        title: 'Dispel / Decurse',
        headers: ['Effect', 'Instruction'],
        rows: [
          ['Phase Shifted', cell(rows, 7, 1)],
          ['Curse of the Rift', cell(rows, 7, 4)]
        ]
      }
    ],
    notes: [
      ...(notesFor(notes, 'sanv').length
        ? [{ title: 'Kara notes', items: notesFor(notes, 'sanv') }]
        : [])
    ],
    imageAsset: '/assets/sanv.png',
    extraImages: []
  };
}

function buildRupturan(rows, notes) {
  const legacy = () => ({
    name: 'Rupturan',
    description: 'Two-phase encounter with fragments and exile management.',
    highlights: [
      'Phase 1 assigns tanks/healers to boss, exiles, stones',
      'Fragments A/B/C each have tank/healer/soaker',
      'Crumbling Exile handled by casters'
    ],
    tables: [
      {
        title: 'Phase 1',
        headers: ['Assignment', 'Tank', 'Healer', 'Extra'],
        rows: [
          ['Boss', cell(rows, 4, 1), cell(rows, 4, 2), ''],
          [
            'Exiles (x4)',
            cell(rows, 4, 3),
            cell(rows, 4, 4),
            cell(rows, 5, 3) ? cell(rows, 5, 3) : cell(rows, 5, 2)
          ],
          [
            'Living Stone',
            cell(rows, 4, 7),
            cell(rows, 4, 8),
            `Soaker: ${cell(rows, 4, 6)}`
          ],
          [
            'Support team',
            cell(rows, 4, 15),
            cell(rows, 5, 15),
            `Puller: ${cell(rows, 5, 16)}`
          ]
        ]
      },
      {
        title: 'Phase 2 - Fragment A',
        headers: ['Role', 'Player'],
        rows: [
          ['Tank', cell(rows, 8, 1)],
          ['Healer', cell(rows, 8, 2)],
          ['Soaker', cell(rows, 8, 3)],
          ['Living Fragment Tank', cell(rows, 8, 4)],
          ['Living Fragment Healer', cell(rows, 8, 5)],
          ['DPS', cell(rows, 8, 6)]
        ]
      },
      {
        title: 'Phase 2 - Fragment B',
        headers: ['Role', 'Player'],
        rows: [
          ['Tank', cell(rows, 11, 1)],
          ['Healer', cell(rows, 11, 2)],
          ['Soaker', cell(rows, 11, 3)],
          ['Living Fragment Tank', cell(rows, 11, 4)],
          ['Living Fragment Healer', cell(rows, 11, 5)],
          ['DPS', cell(rows, 11, 6)]
        ]
      },
      {
        title: 'Phase 2 - Fragment C',
        headers: ['Role', 'Player'],
        rows: [
          ['Tank', cell(rows, 14, 1)],
          ['Healer', cell(rows, 14, 2)],
          ['Soaker', cell(rows, 14, 3)],
          ['Living Fragment Tank', cell(rows, 14, 4)],
          ['Living Fragment Healer', cell(rows, 14, 5)],
          ['DPS', cell(rows, 14, 6)]
        ]
      },
      {
        title: 'Crumbling Exile',
        headers: ['Role', 'Player/Note'],
        rows: [
          ['Tank', cell(rows, 17, 1)],
          ['Healer', cell(rows, 17, 2)],
          ['DPS', 'Casters']
        ]
      }
    ],
    notes: [
      {
        title: 'Debuffs',
        items: ['Felheart/Mana Drain: focus by shadow priests and hunters.']
      },
      ...(notesFor(notes, 'rupturan').length
        ? [{ title: 'Kara notes', items: notesFor(notes, 'rupturan') }]
        : []),
      ...(notesForContains(notes, 'rupturan', 'prep').length
        ? [{ title: 'Preparation', items: notesForContains(notes, 'rupturan', 'prep') }]
        : [])
    ],
    imageAsset: '/assets/rupturan.png',
    extraImages: ['/assets/ruptp1.png', '/assets/ruptp2.png']
  });

  const colIndex = (rowIndex, label) => {
    const row = rows[rowIndex] || [];
    return row.findIndex((c) => (c || '').trim().toLowerCase() === label.toLowerCase());
  };

  const bossHeaderRow = findRow(rows, 'Boss');
  const fragARow = findRow(rows, 'Rupturan Fragment A');
  const fragBRow = findRow(rows, 'Rupturan Fragment B');
  const fragCRow = findRow(rows, 'Rupturan Fragment C');
  const crumbleRow = findRow(rows, 'Crumbling Exile');
  const felheartRow = findRow(rows, 'Felheart');

  if (bossHeaderRow === -1 || fragARow === -1) {
    return legacy();
  }

  const bossCol = colIndex(bossHeaderRow, 'Boss');
  const exileCol = colIndex(bossHeaderRow, 'Exiles (x4)');
  const stoneCol = colIndex(bossHeaderRow, 'Living Stone');
  if (bossCol === -1 || exileCol === -1 || stoneCol === -1) {
    return legacy();
  }

  const phase1Rows = [];
  for (let r = bossHeaderRow + 2; r < rows.length; r += 1) {
    const bossTank = cell(rows, r, bossCol);
    const bossHealer = cell(rows, r, bossCol + 1);
    const exileTank = cell(rows, r, exileCol);
    const exileHealer1 = cell(rows, r, exileCol + 1);
    const exileHealer2 = cell(rows, r, exileCol + 2);
    const soaker = cell(rows, r, stoneCol);
    const stoneTank = cell(rows, r, stoneCol + 1);
    const stoneHealer = cell(rows, r, stoneCol + 2);
    const hasData = [
      bossTank,
      bossHealer,
      exileTank,
      exileHealer1,
      exileHealer2,
      soaker,
      stoneTank,
      stoneHealer
    ].some((v) => (v || '').trim());
    if (!hasData) break;
    phase1Rows.push([
      bossTank,
      bossHealer,
      exileTank,
      exileHealer1,
      exileHealer2,
      soaker,
      stoneTank,
      stoneHealer
    ]);
  }

  const buildFragmentTable = (rowIndex, label) => {
    const ruptCol = colIndex(rowIndex, label);
    const livingCol = colIndex(rowIndex, label.replace('Rupturan', 'Living'));
    if (ruptCol === -1 || livingCol === -1) {
      return {
        title: `Phase 2 - ${label.replace('Rupturan ', '')}`,
        headers: ['Tank', 'Healer', 'Soaker', 'Living Tank', 'Living Healer', 'DPS'],
        rows: [['', '', '', '', '', '']]
      };
    }
    const dataRow = rowIndex + 2;
    return {
      title: `Phase 2 - ${label.replace('Rupturan ', '')}`,
      headers: ['Tank', 'Healer', 'Soaker', 'Living Tank', 'Living Healer', 'DPS'],
      rows: [[
        cell(rows, dataRow, ruptCol),
        cell(rows, dataRow, ruptCol + 1),
        cell(rows, dataRow, ruptCol + 2),
        cell(rows, dataRow, livingCol),
        cell(rows, dataRow, livingCol + 1),
        cell(rows, dataRow, livingCol + 2)
      ]]
    };
  };

  const crumbleCol = crumbleRow !== -1 ? colIndex(crumbleRow, 'Crumbling Exile') : -1;
  const crumbleTable = crumbleCol !== -1 ? {
    title: 'Crumbling Exile',
    headers: ['Tank', 'Healer', 'DPS'],
    rows: [[
      cell(rows, crumbleRow + 2, crumbleCol),
      cell(rows, crumbleRow + 2, crumbleCol + 1),
      cell(rows, crumbleRow + 2, crumbleCol + 2)
    ]]
  } : null;

  let felheartTable = null;
  if (felheartRow !== -1) {
    const manaCol = colIndex(felheartRow + 1, 'Mana Drain');
    const dpsCol = colIndex(felheartRow + 1, 'DPS');
    if (manaCol !== -1 && dpsCol !== -1) {
      const felRows = [];
      for (let r = felheartRow + 2; r < rows.length; r += 1) {
        const mana = cell(rows, r, manaCol);
        const dps = cell(rows, r, dpsCol);
        if (!(mana || '').trim() && !(dps || '').trim()) break;
        felRows.push([mana, dps]);
      }
      felheartTable = {
        title: 'Felheart',
        headers: ['Mana Drain', 'DPS'],
        rows: felRows.length ? felRows : [['', '']]
      };
    }
  }

  const phase1BossTable = {
    title: 'Phase 1 - Boss',
    headers: ['Tank', 'Healer'],
    rows: phase1Rows.length
      ? phase1Rows.map((r) => [r[0], r[1]])
      : [['', '']]
  };
  const phase1ExilesTable = {
    title: 'Phase 1 - Exiles (x4)',
    headers: ['Tank', 'Healer', 'Healer 2'],
    rows: phase1Rows.length
      ? phase1Rows.map((r) => [r[2], r[3], r[4]])
      : [['', '', '']]
  };
  const phase1StoneTable = {
    title: 'Phase 1 - Living Stone',
    headers: ['Soaker', 'Tank', 'Healer'],
    rows: phase1Rows.length
      ? phase1Rows.map((r) => [r[5], r[6], r[7]])
      : [['', '', '']]
  };

  const tables = [
    phase1BossTable,
    phase1ExilesTable,
    phase1StoneTable,
    buildFragmentTable(fragARow, 'Rupturan Fragment A'),
    buildFragmentTable(fragBRow, 'Rupturan Fragment B'),
    buildFragmentTable(fragCRow, 'Rupturan Fragment C'),
    ...(crumbleTable ? [crumbleTable] : []),
    ...(felheartTable ? [felheartTable] : [])
  ];

  return {
    name: 'Rupturan',
    description: 'Two-phase encounter with fragments and exile management.',
    highlights: [
      'Phase 1 assigns tanks/healers to boss, exiles, stones',
      'Fragments A/B/C each have tank/healer/soaker',
      'Crumbling Exile handled by casters'
    ],
    tables,
    notes: [
      {
        title: 'Debuffs',
        items: ['Felheart/Mana Drain: focus by shadow priests and hunters.']
      },
      ...(notesFor(notes, 'rupturan').length
        ? [{ title: 'Kara notes', items: notesFor(notes, 'rupturan') }]
        : []),
      ...(notesForContains(notes, 'rupturan', 'prep').length
        ? [{ title: 'Preparation', items: notesForContains(notes, 'rupturan', 'prep') }]
        : [])
    ],
    imageAsset: '/assets/rupturan.png',
    extraImages: ['/assets/ruptp1.png', '/assets/ruptp2.png']
  };
}

function buildKruul(rows, notes) {
  const findRowContains = (text) =>
    rows.findIndex((r) => r.some((c) => (c || '').toLowerCase().includes(text.toLowerCase())));

  const groupRow = findRowContains('group 1');
  const healerGroupsRows = [];
  if (groupRow !== -1) {
    const row = rows[groupRow] || [];
    const row2 = rows[groupRow + 1] || [];
    const groups = ['Group 1', 'Group 2', 'Group 3', 'Group 4'];
    for (const g of groups) {
      const col = row.findIndex((c) => (c || '').trim().toLowerCase() === g.toLowerCase());
      if (col === -1) continue;
      const sourceRow = g === 'Group 3' || g === 'Group 4' ? row2 : row;
      let h1 = '';
      let h2 = '';
      if (col <= 5) {
        h1 = cell(rows, g === 'Group 3' ? groupRow + 1 : groupRow, col - 2);
        h2 = cell(rows, g === 'Group 3' ? groupRow + 1 : groupRow, col - 1);
      } else {
        h1 = cell(rows, g === 'Group 4' ? groupRow + 1 : groupRow, col + 1);
        h2 = cell(rows, g === 'Group 4' ? groupRow + 1 : groupRow, col + 2);
      }
      const healers = [h1, h2].filter(Boolean).join(', ');
      healerGroupsRows.push([g, healers]);
    }
  }

  const healerGroups = {
    title: 'Healer Groups',
    headers: ['Group', 'Healers'],
    rows: healerGroupsRows.length ? healerGroupsRows : [['Group 1', ''], ['Group 2', '']]
  };

  const healerHeaderRow = findRow(rows, 'Healer');
  const assignmentRows = [];
  if (healerHeaderRow !== -1) {
    assignmentRows.push([cell(rows, healerHeaderRow + 1, 0), cell(rows, healerHeaderRow + 1, 1)]);
  }
  const assignments = {
    title: 'Assignments',
    headers: ['Healer', 'Fire Res Tank'],
    rows: assignmentRows.length ? assignmentRows : [['', '']]
  };

  const tauntHeaderRow = findRowContains('taunt rotation');
  const tauntRows = [];
  if (tauntHeaderRow !== -1) {
    for (let r = tauntHeaderRow + 1; r < rows.length; r += 1) {
      const tank = cell(rows, r, 0);
      const order = cell(rows, r, 1);
      if (!(tank || '').trim() && !(order || '').trim()) break;
      tauntRows.push([tank, order]);
    }
  }
  const taunt = {
    title: 'Taunt Rotation (Phase 2)',
    headers: ['Tank', 'Order'],
    rows: tauntRows.length ? tauntRows : [['', '']]
  };

  const skipRow = findRowContains('skip paladins');
  let reminderText = '';
  if (skipRow !== -1) {
    const row = rows[skipRow] || [];
    const idx = row.findIndex((c) => (c || '').toLowerCase().includes('skip paladins'));
    reminderText = idx !== -1 ? cell(rows, skipRow, idx) : '';
  }
  const reminder = {
    title: 'Reminder',
    headers: ['Note'],
    rows: [[reminderText || '']]
  };

  return {
    name: 'Kruul',
    description: 'Taunt rotation and healer grouping.',
    highlights: [
      `Fire resistance tank: ${cell(rows, 9, 1) || cell(rows, 5, 1)}`,
      'Taunt order listed below'
    ],
    tables: [
      healerGroups,
      assignments,
      taunt,
      reminder
    ],
    notes: [
      ...(notesFor(notes, 'kruul').length
        ? [{ title: 'Kara notes', items: notesFor(notes, 'kruul') }]
        : [])
    ],
    imageAsset: '/assets/kruul.png',
    extraImages: []
  };
}

function buildMeph(rows, notes) {
  const findRowContains = (text) =>
    rows.findIndex((r) => r.some((c) => (c || '').toLowerCase().includes(text.toLowerCase())));

  const colIndex = (rowIndex, label) => {
    const row = rows[rowIndex] || [];
    return row.findIndex((c) => (c || '').trim().toLowerCase() === label.toLowerCase());
  };

  const legacy = () => ({
    name: 'Mephistroth',
    description: 'Assignments for boss, doomguards, crawlers, and shard teams.',
    highlights: [
      'Check shard teams below',
      'Use fear/sleep/vamp priorities from sheet'
    ],
    tables: [],
    notes: [
      ...(notesFor(notes, 'mephistroth').length
        ? [{ title: 'Kara notes', items: notesFor(notes, 'mephistroth') }]
        : [])
    ],
    imageAsset: '/assets/mephistroth.png',
    extraImages: []
  });

  const headerRow = findRowContains('boss');
  if (headerRow === -1) return legacy();

  const bossCol = colIndex(headerRow, 'Boss');
  const doomCol = colIndex(headerRow, 'Doomguards');
  const crawlerCol = colIndex(headerRow, 'Nightmare Crawlers');
  if (bossCol === -1 || doomCol === -1 || crawlerCol === -1) return legacy();

  const mainBoss = [];
  const mainDoomguard = [];
  const mainCrawler = [];
  for (let r = headerRow + 2; r < rows.length; r += 1) {
    const bossTank = cell(rows, r, bossCol);
    const bossHealer = cell(rows, r, bossCol + 1);
    const doomTank = cell(rows, r, doomCol);
    const doomHealer = cell(rows, r, doomCol + 1);
    const crawlTank = cell(rows, r, crawlerCol);
    const crawlHealer = cell(rows, r, crawlerCol + 1);
    const crawlDps = cell(rows, r, crawlerCol + 2);
    const has = [bossTank, bossHealer, doomTank, doomHealer, crawlTank, crawlHealer, crawlDps]
      .some((v) => (v || '').trim());
    if (!has) break;
    if (bossTank || bossHealer) mainBoss.push([bossTank, bossHealer]);
    if (doomTank || doomHealer) mainDoomguard.push([doomTank, doomHealer]);
    if ((crawlTank || crawlHealer || crawlDps) && mainCrawler.length === 0) {
      mainCrawler.push([crawlTank, crawlHealer, crawlDps]);
    }
  }

  const abilitiesHeader = findRowContains('fear ward');
  const abilities = {
    fear: [],
    sleep: [],
    aura: [],
    swarm: [],
    melee: [],
    ranged: []
  };
  if (abilitiesHeader !== -1) {
    const fearCol = colIndex(abilitiesHeader, 'Fear ward');
    const sleepCol = colIndex(abilitiesHeader, 'Sleep Paralysis');
    const auraCol = colIndex(abilitiesHeader, 'Vampiric Aura');
    const swarmCol = colIndex(abilitiesHeader, 'Carrion Swarm');
    const meleeCol = colIndex(abilitiesHeader, 'Melee DPS Prio');
    const rangedCol = colIndex(abilitiesHeader, 'Ranged DPS Prio');
    for (let r = abilitiesHeader + 1; r < rows.length; r += 1) {
      const any = [fearCol, sleepCol, auraCol, swarmCol, meleeCol, rangedCol]
        .some((c) => c !== -1 && (cell(rows, r, c) || '').trim());
      if (!any) break;
      abilities.fear.push(cell(rows, r, fearCol));
      abilities.sleep.push(cell(rows, r, sleepCol));
      abilities.aura.push(cell(rows, r, auraCol));
      abilities.swarm.push(cell(rows, r, swarmCol));
      abilities.melee.push(cell(rows, r, meleeCol));
      abilities.ranged.push(cell(rows, r, rangedCol));
    }
  }

  const frontRow = findRowContains('front 1');
  let front1 = '';
  let front2 = '';
  if (frontRow !== -1) {
    const front1Col = colIndex(frontRow, 'Front 1');
    const front2Col = colIndex(frontRow, 'Front 2');
    front1 = cell(rows, frontRow + 1, front1Col);
    front2 = cell(rows, frontRow + 1, front2Col);
  }

  const backHeader = findRowContains('back left');
  const backLeftRows = [];
  const backRightRows = [];
  if (backHeader !== -1) {
    const backLeftCol = colIndex(backHeader, 'Back Left');
    const backRightCol = colIndex(backHeader, 'Back Right');
    for (let r = backHeader + 1; r < rows.length; r += 1) {
      const left1 = cell(rows, r, backLeftCol);
      const left2 = cell(rows, r, backLeftCol + 1);
      const right1 = cell(rows, r, backRightCol);
      const right2 = cell(rows, r, backRightCol + 1);
      if (![left1, left2, right1, right2].some((v) => (v || '').trim())) break;
      const leftNames = [left1, left2].filter((v) => (v || '').trim());
      const rightNames = [right1, right2].filter((v) => (v || '').trim());
      if (leftNames.length) backLeftRows.push([leftNames.join(', ')]);
      if (rightNames.length) backRightRows.push([rightNames.join(', ')]);
    }
  }

  const doomRow = findRowContains('doom of outland');
  const painRow = findRowContains('painful insomnia');
  const dreadRow = findRowContains('dread of outland');
  const notesItems = [];
  if (doomRow !== -1) notesItems.push(`Doom of Outland: ${cell(rows, doomRow + 1, 0) || 'All'}`);
  if (painRow !== -1) notesItems.push(`Painful Insomnia: ${cell(rows, painRow + 1, 0) || 'All'}`);
  if (dreadRow !== -1) notesItems.push(`${cell(rows, dreadRow, 0) || 'Dread of Outland'}: ${cell(rows, dreadRow + 1, 0) || 'Do NOT decurse'}`);

  return {
    name: 'Mephistroth',
    description: 'Assignments for boss, doomguards, crawlers, and shard teams.',
    highlights: [
      'Check shard teams below',
      'Use fear/sleep/vamp priorities from sheet'
    ],
    tables: [
      {
        title: 'Boss',
        headers: ['Tank', 'Healer'],
        rows: mainBoss.length ? mainBoss : [['', '']]
      },
      {
        title: 'Doomguards',
        headers: ['Tank', 'Healer'],
        rows: mainDoomguard.length ? mainDoomguard : [['', '']]
      },
      {
        title: 'Nightmare Crawlers',
        headers: ['Tank', 'Healer', 'DPS'],
        rows: mainCrawler.length ? mainCrawler : [['', '', '']]
      },
      {
        title: 'Fear ward / Sleep Paralysis',
        headers: ['Fear ward', 'Sleep Paralysis'],
        rows: abilities.fear.length
          ? abilities.fear.map((v, i) => [v, abilities.sleep[i]])
          : [['', '']]
      },
      {
        title: 'Vampiric Aura / Carrion Swarm',
        headers: ['Vampiric Aura', 'Carrion Swarm'],
        rows: abilities.aura.length
          ? abilities.aura.map((v, i) => [v, abilities.swarm[i]])
          : [['', '']]
      },
      {
        title: 'DPS Priorities',
        headers: ['Melee DPS Prio', 'Ranged DPS Prio'],
        rows: abilities.melee.length
          ? abilities.melee.map((v, i) => [v, abilities.ranged[i]])
          : [['', '']]
      },
      {
        title: 'Shard Teams (Front)',
        headers: ['Front 1', 'Front 2'],
        rows: [[front1, front2]]
      },
      {
        title: 'Shard Teams (Back Left)',
        headers: ['Back Left'],
        rows: backLeftRows.length ? backLeftRows : [['—']]
      },
      {
        title: 'Shard Teams (Back Right)',
        headers: ['Back Right'],
        rows: backRightRows.length ? backRightRows : [['—']]
      }
    ],
    notes: [
      ...(notesItems.length ? [{ title: 'Doom / Insomnia / Dread', items: notesItems }] : []),
      ...(notesFor(notes, 'mephistroth').length
        ? [{ title: 'Kara notes', items: notesFor(notes, 'mephistroth') }]
        : [])
    ],
    imageAsset: '/assets/mephistroth.png',
    extraImages: []
  };
}

function buildLeyWatcher(rows, notes) {
  const bossRows = [];
  const trapRows = [];

  for (let r = 3; r <= 5 && r < rows.length; r += 1) {
    const tank = cell(rows, r, 0);
    const healer = cell(rows, r, 1);
    const backLeft = cell(rows, r, 3);
    const backRight = cell(rows, r, 4);
    if (tank || healer) bossRows.push([tank, healer]);
    if (backLeft || backRight) trapRows.push([backLeft, backRight]);
  }

  return {
    name: 'Incantagos',
    description: 'Boss tanks/healers plus hunter traps coverage.',
    highlights: ['Tank/heal assignments and hunter trap positions'],
    tables: [
      {
        title: 'Boss',
        headers: ['Tank', 'Healer'],
        rows: bossRows
      },
      ...(trapRows.length
        ? [{
            title: 'Hunter Traps',
            headers: ['Back left', 'Back right'],
            rows: trapRows
          }]
        : [])
    ],
    notes: [
      ...(notesForContains(notes, 'ley-watcher incantagos', 'prep').length
        ? [{ title: 'Preparation', items: notesForContains(notes, 'ley-watcher incantagos', 'prep') }]
        : []),
      ...(notesForContains(notes, 'incantagos', 'recovery').length
        ? [{ title: 'Recovery', items: notesForContains(notes, 'incantagos', 'recovery') }]
        : []),
      ...(notesForContains(notes, 'incantagos', 'trash').length
        ? [{ title: 'Trash', items: notesForContains(notes, 'incantagos', 'trash') }]
        : [])
    ],
    imageAsset: '/assets/leywatcher.png',
    extraImages: []
  };
}

function buildEcho(rows, notes) {
  const bossRows = [];
  const kiterRows = [];
  const cotRows = [];
  const kickerRows = [];

  const findRowContains = (text) =>
    rows.findIndex((r) => r.some((c) => (c || '').toLowerCase().includes(text)));

  const collectColumnBelow = (startRow, col) => {
    const collected = [];
    let blankStreak = 0;
    for (let r = startRow; r < rows.length; r += 1) {
      const val = cell(rows, r, col).trim();
      if (!val) {
        if (collected.length) blankStreak += 1;
        if (blankStreak >= 2) break;
        continue;
      }
      blankStreak = 0;
      collected.push(val);
    }
    return collected;
  };

  const bossHeaderRow = findRowContains('boss');
  const tankHeaderRow = bossHeaderRow >= 0 ? bossHeaderRow + 1 : findRowContains('tank');
  let tankCol = -1;
  let healerCol = -1;
  if (tankHeaderRow >= 0) {
    const headerRow = rows[tankHeaderRow] || [];
    for (let c = 0; c < headerRow.length; c += 1) {
      const val = (headerRow[c] || '').toLowerCase().trim();
      if (val === 'tank') tankCol = c;
      if (val === 'healer') healerCol = c;
    }
  }

  if (tankCol >= 0 || healerCol >= 0) {
    let blankStreak = 0;
    const startRow = tankHeaderRow + 1;
    for (let r = startRow; r < rows.length; r += 1) {
      const tank = tankCol >= 0 ? cell(rows, r, tankCol).trim() : '';
      const healer = healerCol >= 0 ? cell(rows, r, healerCol).trim() : '';
      if (!tank && !healer) {
        if (bossRows.length) blankStreak += 1;
        if (blankStreak >= 2) break;
        continue;
      }
      blankStreak = 0;
      if (tank.toLowerCase() === 'tank' && healer.toLowerCase() === 'healer') continue;
      bossRows.push([tank, healer]);
    }
  }

  const infernalHeaderRow = findRowContains('infernals');
  const kiterHeaderRow = infernalHeaderRow >= 0 ? infernalHeaderRow + 1 : findRowContains('kiter');
  let kiterCol = -1;
  if (kiterHeaderRow >= 0) {
    const headerRow = rows[kiterHeaderRow] || [];
    for (let c = 0; c < headerRow.length; c += 1) {
      const val = (headerRow[c] || '').toLowerCase().trim();
      if (val === 'kiter') kiterCol = c;
    }
  }
  if (kiterCol >= 0) {
    const kiters = collectColumnBelow(kiterHeaderRow + 1, kiterCol);
    for (const kiter of kiters) {
      const kiterLower = kiter.toLowerCase();
      const isKicker = kiterLower.includes('shadowbolt') || kiterLower.includes('bootybaker');
      if (isKicker) kickerRows.push([kiter]);
      else kiterRows.push([kiter]);
    }
  }

  const cotRow = findRowContains('cot');
  if (cotRow >= 0) {
    const row = rows[cotRow] || [];
    const cotCol = row.findIndex((c) => (c || '').toLowerCase().includes('cot'));
    if (cotCol >= 0) {
      const cotPlayers = collectColumnBelow(cotRow + 1, cotCol);
      cotPlayers.forEach((p) => cotRows.push([p]));
    }
  }

  const kickerHeaderRow = findRowContains('shadowbolt');
  if (kickerHeaderRow >= 0) {
    const row = rows[kickerHeaderRow] || [];
    const kickerCol = row.findIndex((c) => (c || '').toLowerCase().includes('shadowbolt'));
    if (kickerCol >= 0) {
      const kickers = collectColumnBelow(kickerHeaderRow + 1, kickerCol);
      kickers.forEach((p) => kickerRows.push([p]));
    }
  }

  const tables = [
    {
      title: 'Boss',
      headers: ['Tank', 'Healer'],
      rows: bossRows
    }
  ];

  if (kiterRows.length) {
    tables.push({
      title: 'Infernals Kiters',
      headers: ['Kiter'],
      rows: kiterRows
    });
  }

  if (cotRows.length) {
    tables.push({
      title: 'CoT / Xiomora',
      headers: ['Player'],
      rows: cotRows.filter((r) => r[0].toLowerCase() !== 'cot')
    });
  }

  if (kickerRows.length) {
    tables.push({
      title: 'Shadowbolt Kickers',
      headers: ['Player'],
      rows: kickerRows.filter((r) => !r[0].toLowerCase().includes('shadowbolt kicker'))
    });
  }

  return {
    name: 'Echo of Medivh',
    description: 'Boss tanks/healers, infernal kiters, and special roles.',
    highlights: [
      'Infernal kiters and boss teams',
      'Separate callouts for CoT/Xiomora and Shadowbolt kickers'
    ],
    tables,
    notes: [
      ...(notesFor(notes, 'echo of medivh').length
        ? [{ title: 'Kara notes', items: notesFor(notes, 'echo of medivh') }]
        : []),
      ...(notesForContains(notes, 'echo of medivh', 'prep').length
        ? [{ title: 'Preparation', items: notesForContains(notes, 'echo of medivh', 'prep') }]
        : [])
    ],
    imageAsset: '/assets/echo.png',
    extraImages: []
  };
}

function buildGeneric(name, rows, notes) {
  const cleaned = rows.filter((r) => r.some((c) => c.trim()))
  if (cleaned.length && cleaned[0].filter((c) => c.trim()).length === 1 && cleaned[0][0].toLowerCase() === name.toLowerCase()) {
    cleaned.shift();
  }

  let headers = [];
  let body = [];
  if (cleaned.length) {
    headers = [...cleaned[0]];
    while (headers.length && !headers[0].trim()) {
      headers.shift();
      for (let i = 0; i < cleaned.length; i += 1) {
        if (cleaned[i].length) cleaned[i].shift();
      }
    }
    const maxCols = headers.length;
    body = cleaned.slice(1).map((r) => {
      const row = Array(maxCols).fill('');
      for (let i = 0; i < r.length && i < maxCols; i += 1) row[i] = r[i];
      return row;
    });
  }

  return {
    name,
    description: `Assignments pulled from sheet tab ${name}.`,
    highlights: ['Live data from sheet', `Tab: ${name}`],
    tables: [{ title: name, headers, rows: body }],
    notes: [
      ...(notesFor(notes, name.toLowerCase()).length
        ? [{ title: 'Kara notes', items: notesFor(notes, name.toLowerCase()) }]
        : [])
    ],
    imageAsset: assetForGeneric(name),
    extraImages: []
  };
}

function assetForGeneric(name) {
  const lower = name.toLowerCase();
  if (lower.includes('ley-watcher')) return '/assets/leywatcher.png';
  if (lower.includes('echo')) return '/assets/echo.png';
  return '/assets/anomalus.png';
}

export { buildGeneric };
