import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/warcraftcn/button';
import { Card } from '@/components/ui/warcraftcn/card';
import { Avatar } from '@/components/ui/warcraftcn/avatar';
import { Badge } from '@/components/ui/warcraftcn/badge';
import { Checkbox } from '@/components/ui/warcraftcn/checkbox';

export default function MyAssignments({ bosses, character, onBack }) {
  const [showNotes, setShowNotes] = useState(false);
  const lower = (character?.name || '').toLowerCase();

  const entries = useMemo(() => collectAssignments(bosses, character), [bosses, character]);
  const visibleEntries = showNotes ? entries : entries.filter((e) => !e.notesOnly);

  return (
    <div className="page">
      <div className="page-header">
        <Button variant="frame" className="back-btn" onClick={onBack}>Back</Button>
        <div className="page-title">My Assignments</div>
        <Checkbox
          id="show-notes"
          checked={showNotes}
          onCheckedChange={(value) => setShowNotes(Boolean(value))}
          faction="human"
        >
          Show notes
        </Checkbox>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="empty">No assignments found for that name.</div>
      ) : (
        <div className="assignments">
          {visibleEntries.map((e, idx) => (
            <div className="assign-row" key={`${e.boss}-${e.section}-${idx}`}>
              <div className="timeline">
                <div className="dot" />
                <div className={`line ${idx === visibleEntries.length - 1 ? 'end' : ''}`} />
              </div>
              <Card className="assign-card" data-size="sm">
                <div className="card-inner">
                  <div className="assign-header">
                    {e.image && <Avatar size="sm" src={e.image} className="hit-avatar" />}
                    <Badge size="sm" variant="default">{e.boss}</Badge>
                    <Badge size="sm" variant="secondary">{e.section}</Badge>
                    {e.notesOnly && showNotes && <Badge size="sm" variant="destructive">Prep</Badge>}
                  </div>

                  {e.detail && <div className="assign-detail">{e.detail}</div>}

                  {e.headers.length > 0 ? (
                    <div className="table-wrap">
                      {tablePreview(e.headers, e.row, lower, e.reasonHighlight)}
                    </div>
                  ) : (
                    e.notesOnly && showNotes && (
                      <div className="assign-detail">No direct assignment; see notes.</div>
                    )
                  )}

                  {showNotes && e.notes.length > 0 && (
                    <div className="note-list">
                      {e.notes.map((n, i) => (
                        <div className="note-item" key={`${i}-${n}`}>
                          <span className="bullet">•</span>
                          <span>{n}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function tablePreview(headers, row, lower, highlightWord) {
  return (
    <table className="table">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {headers.map((_, i) => {
            const value = i < row.length ? row[i] : '';
            const isHit = value.toLowerCase().includes(lower) ||
              (highlightWord && value.toLowerCase().includes(highlightWord.toLowerCase()));
            return (
              <td key={`${i}-${value}`} className={isHit ? 'hit' : ''}>{value}</td>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
}

function collectAssignments(bosses, character) {
  if (!character || !character.name) return [];
  const lowerName = character.name.toLowerCase();
  const list = [];
  const wantMelee = character.role.toLowerCase().includes('melee');
  const wantRanged = character.role.toLowerCase().includes('ranged');

  for (const boss of bosses) {
    const isAnomalus = boss.name.toLowerCase() === 'anomalus';
    const anomalusTanks = new Set();
    const anomalusOrder = {};

    if (isAnomalus) {
      for (const section of boss.tables) {
        if (section.title.toLowerCase().includes('tank order')) {
          for (const row of section.rows) {
            for (const cell of row) {
              const trimmed = (cell || '').trim().toLowerCase();
              if (trimmed) anomalusTanks.add(trimmed);
            }
            if (row.length) {
              const tank = (row[0] || '').trim().toLowerCase();
              const order = (row[1] || '').trim();
              if (tank && order) anomalusOrder[tank] = order;
            }
          }
        }
      }

      if (!Object.keys(anomalusOrder).length) {
        for (const section of boss.tables) {
          if (!section.title.toLowerCase().includes('tank')) continue;
          for (const row of section.rows) {
            for (const cell of row) {
              const parts = (cell || '').split(',');
              for (let i = 0; i < parts.length; i += 1) {
                const name = parts[i].trim().toLowerCase();
                if (!name) continue;
                anomalusTanks.add(name);
                anomalusOrder[name] = ordinal(i + 1);
              }
            }
          }
        }
      }
    }

    let rowMatched = false;
    const addedAnomalusSections = new Set();
    const addedSectionsForPerson = new Set();

    for (const section of boss.tables) {
      let lastTankName = '';
      const tankCol = section.headers.findIndex((h) => h.toLowerCase().includes('tank'));
      for (const row of section.rows) {
        const isMeaningfulRow = row.some((c) => (c || '').trim());
        if (!isMeaningfulRow) continue;
        if (tankCol >= 0 && tankCol < row.length && row[tankCol].trim()) {
          lastTankName = row[tankCol].trim();
        }
        if (row.some((c) => (c || '').toLowerCase().includes(lowerName))) {
          if (isAnomalus && section.title.toLowerCase().includes('healer layout') && anomalusTanks.has(lowerName)) {
            continue;
          }
          if (isAnomalus && section.title.toLowerCase().includes('tank healers') && anomalusTanks.has(lowerName)) {
            continue;
          }
          if (isAnomalus && section.title.toLowerCase().includes('healer layout') && tankCol >= 0 && tankCol < row.length && row[tankCol].toLowerCase().includes(lowerName)) {
            continue;
          }
          if (isAnomalus && anomalusTanks.has(lowerName) && addedAnomalusSections.has(section.title.toLowerCase())) {
            continue;
          }
          const sectionKey = `${boss.name}|${section.title}`;
          if (section.title.toLowerCase().includes('tank healer') && addedSectionsForPerson.has(sectionKey)) {
            continue;
          }

          let displayRow = row;
          if (tankCol >= 0 && tankCol < row.length && !row[tankCol].trim() && lastTankName) {
            displayRow = [...row];
            displayRow[tankCol] = lastTankName;
          }

          let detail = detailFor(boss.name, section.title, row, lowerName);
          if (boss.name.toLowerCase() === 'rupturan') {
            const tank = rupturanTankForHealer(section, row);
            if (tank) {
              detail = detail ? `${detail} • Tank: ${tank}` : `Tank: ${tank}`;
            }
          }
          if (isAnomalus && anomalusOrder[lowerName]) {
            const ord = anomalusOrder[lowerName];
            if (displayRow.length > 1 && displayRow[0].toLowerCase().includes(lowerName)) {
              displayRow = [...displayRow];
              displayRow[1] = ord;
            } else {
              detail = detail ? `${detail} • Tank order: ${ord}` : `Tank order: ${ord}`;
            }
          }

          const notes = notesForBoss(boss);
          if (!(boss.name.toLowerCase() === 'kruul' && section.title.toLowerCase().includes('group buff') && character.charClass.toLowerCase() !== 'mage')) {
            list.push({
              boss: boss.name,
              section: section.title,
              row: displayRow,
              headers: section.headers,
              detail,
              image: boss.imageAsset,
              notes,
              reasonHighlight: lowerName,
              notesOnly: false
            });
          }

          rowMatched = true;
          if (isAnomalus && anomalusTanks.has(lowerName)) {
            addedAnomalusSections.add(section.title.toLowerCase());
          }
          if (section.title.toLowerCase().includes('tank healer')) {
            addedSectionsForPerson.add(sectionKey);
          }
        }

        const isKruulBuff = boss.name.toLowerCase() === 'kruul' && section.title.toLowerCase().includes('group buff');
        if (!rowMatched && !isKruulBuff && ((wantMelee && (section.title.toLowerCase().includes('melee') || row.some((c) => c.toLowerCase().includes('melee')))) || (wantRanged && (section.title.toLowerCase().includes('ranged') || row.some((c) => c.toLowerCase().includes('ranged')))))) {
          list.push({
            boss: boss.name,
            section: `${section.title} (role)`,
            row,
            headers: section.headers,
            detail: section.title.toLowerCase().includes('melee') ? 'Melee focus' : 'Ranged focus',
            image: boss.imageAsset,
            notes: notesForBoss(boss),
            reasonHighlight: wantMelee ? 'melee' : 'ranged',
            notesOnly: false
          });
          rowMatched = true;
        }
      }
    }

    if (!rowMatched) {
      const notes = notesForBoss(boss);
      if (notes.length) {
        list.push({
          boss: boss.name,
          section: 'Notes',
          row: [],
          headers: [],
          detail: 'Prep / class-related notes',
          image: boss.imageAsset,
          notes,
          notesOnly: true
        });
      }
    }
  }

  return list;
}

function detailFor(boss, section, row, lowerName) {
  const secLower = section.toLowerCase();
  if (boss.toLowerCase() === 'gnarlmoon') {
    if (secLower.includes('left')) return 'Left side';
    if (secLower.includes('right')) return 'Right side';
    if (secLower.includes('tanks')) {
      const leftMatch = row.length > 0 && row[0].toLowerCase().includes(lowerName);
      const rightMatch = row.length > 1 && row[1].toLowerCase().includes(lowerName);
      if (leftMatch) return 'Left Tank';
      if (rightMatch) return 'Right Tank';
    }
  }
  return null;
}

function notesForBoss(boss) {
  const collected = [];
  const seen = new Set();
  for (const note of boss.notes) {
    for (const item of note.items) {
      if (!seen.has(item)) {
        collected.push(item);
        seen.add(item);
      }
    }
  }
  return collected;
}

function rupturanTankForHealer(section, matchedRow) {
  if (!matchedRow.length || section.headers.length !== 2 || !section.headers[0].toLowerCase().includes('role')) {
    return null;
  }
  const roleLower = matchedRow[0].toLowerCase();
  if (!roleLower.includes('healer')) return null;

  const findTank = (contains) => {
    for (const r of section.rows) {
      if (!r.length) continue;
      const role = r[0].toLowerCase();
      if (role.includes(contains) && r.length > 1 && r[1].trim()) {
        return r[1].trim();
      }
    }
    return null;
  };

  if (roleLower.includes('living fragment')) {
    return findTank('living fragment tank') || findTank('tank');
  }
  return findTank('tank');
}

function ordinal(n) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}
