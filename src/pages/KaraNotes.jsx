import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/warcraftcn/button';
import { Card } from '@/components/ui/warcraftcn/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/warcraftcn/pagination';

export default function KaraNotes({ karaNotes, onBack }) {
  const entries = Object.entries(karaNotes || {})
    .filter(([, v]) => v && v.length)
    .map(([k, v]) => [k, Array.from(new Set(v))]);
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [entries.length]);

  const pagedEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return entries.slice(start, start + PAGE_SIZE);
  }, [entries, page]);

  const pageNumbers = useMemo(() => {
    const numbers = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(pageCount, start + 4);
    for (let i = start; i <= end; i += 1) numbers.push(i);
    return numbers;
  }, [page, pageCount]);

  return (
    <div className="page">
      <div className="page-header">
        <Button variant="frame" className="back-btn" onClick={onBack}>Back</Button>
        <div className="page-title">Kara40 Notes</div>
        <div />
      </div>

      {entries.length === 0 ? (
        <div className="empty">No notes available</div>
      ) : (
        <>
        <div className="notes-grid">
          {pagedEntries.map(([key, value]) => (
            <Card className="note-card" data-size="sm" key={key}>
              <div className="card-inner">
                <div className="note-header">
                  <div className="note-title">{key}</div>
                </div>
                <div className="note-list">
                  {value.map((n) => (
                    <div className="note-item" key={n}>
                      <span className="bullet">•</span>
                      <span>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Pagination className="notes-pagination">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                disabled={page === 1}
                onClick={(e) => {
                  e.preventDefault();
                  setPage(Math.max(1, page - 1));
                }}
              />
            </PaginationItem>
            {page > 3 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(1);
                  }}
                >
                  1
                </PaginationLink>
              </PaginationItem>
            )}
            {page > 4 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {pageNumbers.map((num) => (
              <PaginationItem key={num}>
                <PaginationLink
                  href="#"
                  isActive={page === num}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(num);
                  }}
                >
                  {num}
                </PaginationLink>
              </PaginationItem>
            ))}
            {page < pageCount - 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {page < pageCount - 2 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(pageCount);
                  }}
                >
                  {pageCount}
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                disabled={page === pageCount}
                onClick={(e) => {
                  e.preventDefault();
                  setPage(Math.min(pageCount, page + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        </>
      )}
    </div>
  );
}
