import React, { useEffect, useMemo, useRef, useState } from 'react';
import { loadPlans } from './data.js';
import MyAssignments from './pages/MyAssignments.jsx';
import KaraNotes from './pages/KaraNotes.jsx';
import { Button } from '@/components/ui/warcraftcn/button';
import { Card } from '@/components/ui/warcraftcn/card';
import { Input } from '@/components/ui/warcraftcn/input';
import { Avatar } from '@/components/ui/warcraftcn/avatar';
import { Badge } from '@/components/ui/warcraftcn/badge';
import { Cursor } from '@/components/ui/warcraftcn/cursor';
import { Label } from '@/components/ui/warcraftcn/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/warcraftcn/radio-group';
import { Spinner } from '@/components/ui/warcraftcn/spinner';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/warcraftcn/accordion';
// Tabs replaced with simple button toggle row.
import { triggerScrollToast } from '@/components/ui/warcraftcn/toast';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/warcraftcn/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipTitle,
  TooltipBody
} from '@/components/ui/warcraftcn/tooltip';
import { Toaster } from 'sonner';

const CLASSES = [
  'Warrior',
  'Paladin',
  'Hunter',
  'Rogue',
  'Priest',
  'Shaman',
  'Mage',
  'Warlock',
  'Druid'
];

const ROLES = ['Tank', 'Healer', 'Melee DPS', 'Ranged DPS'];

const FACTION_BY_CLASS = {
  Warrior: 'human',
  Paladin: 'human',
  Hunter: 'orc',
  Rogue: 'undead',
  Priest: 'elf',
  Shaman: 'orc',
  Mage: 'elf',
  Warlock: 'undead',
  Druid: 'elf'
};

const factionForClass = (charClass) => FACTION_BY_CLASS[charClass] || 'default';
const badgeFactionForClass = (charClass) => {
  if (!charClass) return 'none';
  const horde = ['Shaman', 'Warlock', 'Rogue', 'Hunter'];
  return horde.includes(charClass) ? 'horde' : 'alliance';
};

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState('home');

  const [characters, setCharacters] = useState([]);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [showCharModal, setShowCharModal] = useState(false);
  const [editingCharIndex, setEditingCharIndex] = useState(null);
  const [showCharPicker, setShowCharPicker] = useState(false);

  const [charForm, setCharForm] = useState({ name: '', charClass: 'Warrior', role: 'Melee DPS' });


  const searchInputRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const [openNotesByBoss, setOpenNotesByBoss] = useState({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!hasLoadedRef.current) setLoading(true);
      try {
        const result = await loadPlans();
        if (!active) return;
        setData(result);
        setSelectedIndex((prev) => {
          if (!hasLoadedRef.current) return 0;
          if (!result?.bosses?.length) return 0;
          if (prev < 0 || prev >= result.bosses.length) return 0;
          return prev;
        });
        hasLoadedRef.current = true;
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 45000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const storedList = localStorage.getItem('char_list');
    const storedIndex = localStorage.getItem('char_index');
    let parsedList = [];
    let index = 0;
    if (storedList) {
      try {
        parsedList = JSON.parse(storedList);
        index = storedIndex ? Number(storedIndex) : 0;
      } catch {
        parsedList = [];
      }
    } else {
      const legacyName = localStorage.getItem('char_name') || '';
      const legacyClass = localStorage.getItem('char_class') || 'Warrior';
      const legacyRole = localStorage.getItem('char_role') || 'Melee DPS';
      if (legacyName) {
        parsedList = [{ name: legacyName, charClass: legacyClass, role: legacyRole }];
      }
    }

    setCharacters(parsedList);
    setCurrentCharIndex(Math.max(0, Math.min(index, parsedList.length - 1)));

    if (!parsedList.length) {
      setCharForm({ name: '', charClass: 'Warrior', role: 'Melee DPS' });
      setShowCharModal(true);
      setEditingCharIndex(null);
    }
  }, []);


  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const bosses = data?.bosses || [];
  const selectedBoss = bosses[selectedIndex] || null;
  const currentChar = characters[currentCharIndex] || { name: '', charClass: 'Warrior', role: 'Melee DPS' };

  useEffect(() => {
    if (!selectedBoss?.notes?.length) return;
    setOpenNotesByBoss((prev) => {
      if (prev[selectedBoss.name]) return prev;
      return {
        ...prev,
        [selectedBoss.name]: selectedBoss.notes.map((note) => note.title)
      };
    });
  }, [selectedBoss]);

  const searchHits = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchAssignments(bosses, searchQuery.trim());
  }, [bosses, searchQuery]);

  const initials = currentChar?.name ? currentChar.name.trim()[0].toUpperCase() : '';
  const cursorFaction = factionForClass(currentChar?.charClass);

  const openCharacterModal = (editing = true, index = null) => {
    if (editing && characters.length) {
      const idx = index ?? currentCharIndex;
      const current = characters[idx];
      setCharForm({
        name: current?.name || '',
        charClass: current?.charClass || 'Warrior',
        role: current?.role || 'Melee DPS'
      });
      setEditingCharIndex(idx);
    } else {
      setCharForm({ name: '', charClass: 'Warrior', role: 'Melee DPS' });
      setEditingCharIndex(null);
    }
    setShowCharModal(true);
  };

  const saveCharacter = () => {
    const entry = {
      name: charForm.name.trim(),
      charClass: charForm.charClass,
      role: charForm.role
    };
    let next = [...characters];
    let newIndex = 0;
    if (editingCharIndex != null && next.length) {
      const idx = Math.max(0, Math.min(editingCharIndex, next.length - 1));
      next[idx] = entry;
      newIndex = idx;
    } else {
      next.push(entry);
      newIndex = next.length - 1;
    }
    setCharacters(next);
    setCurrentCharIndex(newIndex);
    localStorage.setItem('char_list', JSON.stringify(next));
    localStorage.setItem('char_index', String(newIndex));
    localStorage.setItem('char_name', entry.name || '');
    localStorage.setItem('char_class', entry.charClass || 'Warrior');
    localStorage.setItem('char_role', entry.role || 'Melee DPS');
    setShowCharModal(false);
    triggerScrollToast({
      message: entry.name ? `${entry.name} saved` : 'Character saved',
      faction: factionForClass(entry.charClass),
      variant: 'success'
    });
  };

  const setCurrentCharacter = (idx) => {
    const nextIdx = Math.max(0, Math.min(idx, characters.length - 1));
    setCurrentCharIndex(nextIdx);
    localStorage.setItem('char_index', String(nextIdx));
    setShowCharPicker(false);
    const nextChar = characters[nextIdx];
    if (nextChar?.name) {
      triggerScrollToast({
        message: `Active: ${nextChar.name}`,
        faction: factionForClass(nextChar.charClass),
        variant: 'info'
      });
    }
  };

  if (loading) {
    return (
      <LoadingState />
    );
  }

  let content = null;
  if (page === 'my') {
    content = (
      <MyAssignments
        bosses={bosses}
        character={currentChar}
        onBack={() => setPage('home')}
      />
    );
  } else if (page === 'kara') {
    content = (
      <KaraNotes
        karaNotes={data?.karaNotes || {}}
        onBack={() => setPage('home')}
      />
    );
  } else {
    content = (
      <div className="app">
      <header className="header">
        {showSearch ? (
          <div className="search-row">
            <Input
              ref={searchInputRef}
              className="input"
              placeholder="Search your name for assignments"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              variant="frame"
              className="icon-btn"
              onClick={() => {
                setSearchQuery('');
                setShowSearch(false);
              }}
            >
              ✕
            </Button>
          </div>
        ) : (
          <div className="nav-row">
            {currentChar?.name && (
              <div className="char-meta">
                <Badge size="sm" shape="shield" faction={badgeFactionForClass(currentChar.charClass)}>
                  {currentChar.charClass}
                </Badge>
                <Badge size="sm" variant="secondary">
                  {currentChar.role}
                </Badge>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="frame" className="icon-btn" onClick={() => setShowSearch(true)}>🔍</Button>
              </TooltipTrigger>
              <TooltipContent>
                <TooltipTitle>Search</TooltipTitle>
                <TooltipBody>Find your name across assignments.</TooltipBody>
              </TooltipContent>
            </Tooltip>
            <div className="nav-controls">
              <Button
                variant="frame"
                className="icon-btn"
                onClick={() => {
                  if (!bosses.length) return;
                  setSelectedIndex((prev) => (prev - 1 + bosses.length) % bosses.length);
                  setSearchQuery('');
                }}
              >
                ◀
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="frame" className="boss-dropdown">
                    {selectedBoss?.name || 'Select Boss'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" sideOffset={6} className="boss-dropdown-content">
                  {bosses.map((b, idx) => (
                    <DropdownMenuItem
                      key={b.name}
                      onClick={() => {
                        setSelectedIndex(idx);
                        setSearchQuery('');
                      }}
                    >
                      {b.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="frame"
                className="icon-btn"
                onClick={() => {
                  if (!bosses.length) return;
                  setSelectedIndex((prev) => (prev + 1) % bosses.length);
                  setSearchQuery('');
                }}
              >
                ▶
              </Button>
            </div>

            {currentChar?.name ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="frame" className="icon-btn avatar-btn">
                    {initials}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowCharPicker(true)}>Change character</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openCharacterModal(true, currentCharIndex)}>Edit character</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => openCharacterModal(false)}>Add character</Button>
            )}
          </div>
        )}
      </header>

      <main className="content">
        {searchQuery.trim() ? (
          <div>
            <div className="section-title">Search Results</div>
            {searchHits.length === 0 ? (
              <div className="empty">No assignments found for that name.</div>
            ) : (
              <div className="search-results">
                {searchHits.map((hit, idx) => (
                  <Card className="hit-card" data-size="sm" key={`${hit.boss}-${hit.section}-${idx}`}>
                    <div className="hit-header">
                      {hit.image && <Avatar size="sm" src={hit.image} className="hit-avatar" />}
                      <div className="pill primary">{hit.boss}</div>
                      <div className="hit-section">{hit.section}</div>
                    </div>
                    {hit.fullTable ? (
                      <div className="table-wrap">
                        {highlightedTable(hit.headers, hit.rows, hit.query)}
                      </div>
                    ) : (
                      <div className="hit-row">
                        <div className="hit-row-text">{hit.row}</div>
                        {hit.detail && <div className="hit-detail">{hit.detail}</div>}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          selectedBoss && (
            <div className="boss-grid">
              <div className="boss-left">
                <Card className="boss-card">
                  <div className="card-inner">
                    <div className="boss-image">
                      <Avatar src={selectedBoss.imageAsset} alt={selectedBoss.name} size="md" className="boss-avatar" />
                    </div>
                    <div className="boss-name">{selectedBoss.name}</div>
                  </div>
                </Card>

                <Card className="summary" data-size="sm">
                  <div className="card-inner">
                    <div className="summary-text">{selectedBoss.description}</div>
                    <div className="chip-row">
                      {selectedBoss.highlights.map((h) => (
                        <Badge key={h} size="sm" variant="secondary">{h}</Badge>
                      ))}
                    </div>
                  </div>
                </Card>

                {selectedBoss.notes?.length > 0 && (
                  <Accordion
                    type="multiple"
                    className="notes"
                    value={openNotesByBoss[selectedBoss.name] || []}
                    onValueChange={(value) =>
                      setOpenNotesByBoss((prev) => ({
                        ...prev,
                        [selectedBoss.name]: value
                      }))
                    }
                  >
                    {selectedBoss.notes.map((note) => (
                      <AccordionItem value={note.title} key={note.title}>
                        <AccordionTrigger icon="rune-stone">
                          <div className="note-title">{note.title}</div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="note-items">
                            {note.items.map((i) => (
                              <div className="note-item" key={i}>
                                <span className="bullet">★</span>
                                <span>{i}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>

              <div className="boss-right">
                <div className="action-row">
                  {currentChar?.name && bosses.length > 0 && (
                    <Button onClick={() => setPage('my')}>
                      My Assignments
                    </Button>
                  )}
                  {data?.karaNotes && Object.keys(data.karaNotes).length > 0 && (
                    <Button onClick={() => setPage('kara')}>
                      Kara40 Notes
                    </Button>
                  )}
                </div>
                <div className="tab-panel">
                  {selectedBoss.tables?.length ? (
                    <div className="tables">
                      {selectedBoss.tables.map((section) => {
                        const isRoster = ['left side', 'right side'].includes(section.title.toLowerCase());
                        return (
                        <Card
                          className={`table-card${isRoster ? ' list-card' : ''}`}
                          data-size="sm"
                          key={section.title}
                        >
                          <div className="card-inner">
                            <div className="table-title">{section.title}</div>
                            <div className="table-wrap">
                              {simpleTable(section.headers, section.rows)}
                            </div>
                          </div>
                        </Card>
                      );
                      })}
                    </div>
                    ) : (
                    <div className="empty">No assignments found for this boss.</div>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {showCharModal && (
        <div className="modal-backdrop">
          <Card className="modal" data-size="sm">
            <div className="card-inner">
              <div className="modal-title">Save Character</div>
              <div className="form">
                <div className="form-field">
                  <Label htmlFor="char-name" required>Name</Label>
                  <Input
                    id="char-name"
                    className="input"
                    value={charForm.name}
                    onChange={(e) => setCharForm({ ...charForm, name: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="char-class" required>Class</Label>
                  <select
                    id="char-class"
                    className="select"
                    value={charForm.charClass}
                    onChange={(e) => setCharForm({ ...charForm, charClass: e.target.value })}
                  >
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <Label required>Role</Label>
                  <RadioGroup
                    value={charForm.role}
                    onValueChange={(value) => setCharForm({ ...charForm, role: value })}
                    orientation="horizontal"
                    className="role-group"
                  >
                    {ROLES.map((role) => (
                      <div className="role-option" key={role}>
                        <RadioGroupItem value={role} id={`role-${role.replaceAll(' ', '-')}`} />
                        <Label htmlFor={`role-${role.replaceAll(' ', '-')}`} variant="muted">{role}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
              <div className="modal-actions">
                <Button variant="frame" onClick={() => setShowCharModal(false)}>Cancel</Button>
                <Button onClick={saveCharacter}>Save</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showCharPicker && (
        <div className="modal-backdrop" onClick={() => setShowCharPicker(false)}>
          <Card className="modal bottom" data-size="sm" onClick={(e) => e.stopPropagation()}>
            <div className="card-inner">
              <div className="modal-title">Select character</div>
              <div className="list">
                {characters.map((c, i) => (
                  <Button
                    variant="frame"
                    className="list-item"
                    key={`${c.name}-${i}`}
                    onClick={() => setCurrentCharacter(i)}
                  >
                    <div>
                      <div className="list-title">{c.name}</div>
                      <div className="list-sub">{c.charClass} • {c.role}</div>
                    </div>
                    {i === currentCharIndex && <span className="check">✓</span>}
                  </Button>
                ))}
              </div>
              <Button className="add-character-btn" onClick={() => { setShowCharPicker(false); openCharacterModal(false); }}>
                Add character
              </Button>
            </div>
          </Card>
        </div>
      )}

      </div>
    );
  }

  return (
    <Cursor faction={cursorFaction}>
      {content}
      <Toaster position="top-center" />
    </Cursor>
  );
}

function simpleTable(headers, rows) {
  const normalized = rows.map((r) => {
    const filled = Array(headers.length).fill('');
    for (let i = 0; i < r.length && i < headers.length; i += 1) {
      filled[i] = r[i];
    }
    return filled;
  });

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
        {normalized.map((cells, idx) => (
          <tr key={idx}>
            {cells.map((c, i) => (
              <td key={`${i}-${c}`}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function highlightedTable(headers, rows, query) {
  const lowerQuery = query.toLowerCase();
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
        {rows.map((cells, idx) => (
          <tr key={idx}>
            {cells.map((c, i) => {
              const isHit = (c || '').toLowerCase().includes(lowerQuery);
              return (
                <td key={`${i}-${c}`} className={isHit ? 'hit' : ''}>{c}</td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function searchAssignments(bosses, query) {
  const q = query.toLowerCase();
  const hits = [];
  for (const boss of bosses) {
    for (const section of boss.tables) {
      let sectionMatched = false;
      for (const row of section.rows) {
        if (row.some((cell) => (cell || '').toLowerCase().includes(q))) {
          const bossName = boss.name.toLowerCase();
          if (bossName !== 'gnarlmoon' && !sectionMatched) {
            hits.push({
              boss: boss.name,
              section: section.title,
              fullTable: true,
              headers: section.headers,
              rows: section.rows,
              image: boss.imageAsset,
              query: q
            });
            sectionMatched = true;
          } else if (bossName === 'gnarlmoon') {
            let detail = null;
            const secLower = section.title.toLowerCase();
            if (secLower.includes('left')) detail = 'Left side';
            else if (secLower.includes('right')) detail = 'Right side';
            else if (secLower.includes('tanks')) {
              const leftMatch = row.length > 0 && row[0].toLowerCase().includes(q);
              const rightMatch = row.length > 1 && row[1].toLowerCase().includes(q);
              if (leftMatch) detail = 'Left Tank';
              if (rightMatch) detail = 'Right Tank';
            }
            hits.push({
              boss: boss.name,
              section: section.title,
              row: row.join(' | '),
              image: boss.imageAsset,
              detail
            });
          }
        }
        if (sectionMatched) break;
      }
    }
  }
  return hits;
}

function LoadingState() {
  return (
    <div className="loading">
      <Spinner className="loading-spinner" />
    </div>
  );
}
