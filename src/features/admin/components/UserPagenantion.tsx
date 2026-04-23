'use client';

import { Table } from '@tanstack/react-table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface UserPaginationProps {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (newPage: number) => void;
}

export default function UserPagination<TData>({
  currentPage = 1,
  pageSize = 5,
  totalItems = 0,
  onPageChange,
}: UserPaginationProps) {
  const pageCount = Math.ceil(totalItems / pageSize);
  const pageIndex = currentPage - 1;

  return (
    <div className="flex items-center  justify-between mt-4">
      {/* Page Status Text */}
      <div>
        <span className="text-xs text-muted-foreground font-medium">
          Page {pageIndex + 1} of {pageCount}
        </span>
      </div>

      {/* Navigation Controls */}
      <div>
        <Pagination>
          <PaginationContent>
            {/* Previous Button */}
            <PaginationItem>
              <PaginationPrevious
                text=""
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (pageIndex > 0 && onPageChange) onPageChange(pageIndex);
                }}
                className={
                  pageIndex === 0
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>

            {/* Page Numbers */}
            {Array.from({ length: pageCount }).map((_, idx) => (
              <PaginationItem key={idx}>
                <PaginationLink
                  href="#"
                  isActive={pageIndex === idx}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onPageChange) onPageChange(idx + 1);
                  }}
                >
                  {idx + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            {/* Next Button */}
            <PaginationItem>
              <PaginationNext
                text=""
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (pageIndex < pageCount - 1 && onPageChange)
                    onPageChange(pageIndex + 2);
                }}
                className={
                  pageIndex === pageCount - 1
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
