import React from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  Button,
  TextField,
  Box,
  Select,
  MenuItem,
  Chip,
  Typography,
} from "@mui/material";
import "./table.scss";

type Props = any;

export default function Table(props: Props): JSX.Element {
  const {
    rowData,
    columnDefs,
    searchText,
    setSearchText,
    filterColumn,
    setFilterColumn,
    filterOp,
    setFilterOp,
    filterValue,
    setFilterValue,
    filters,
    setFilters,
    handleSearch,
    handleApplyFilters,
    handleDelete,
    loading,
  } = props;

  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const gridApiRef = React.useRef<any>(null);

  const handleRowMouseEnter = React.useCallback((event: any) => {
    const idx = event?.rowIndex ?? event?.rowIndex;
    if (idx === undefined || idx === null) return;
    const root = gridRef.current;
    if (!root) return;

    const prev = root.querySelectorAll(".ag-row.ag-row-hovered");
    prev.forEach((r) => r.classList.remove("ag-row-hovered"));

    const rows = root.querySelectorAll(`.ag-row[row-index="${idx}"]`);
    rows.forEach((r) => r.classList.add("ag-row-hovered"));
  }, []);

  const handleRowMouseLeave = React.useCallback(() => {
    const root = gridRef.current;
    if (!root) return;
    const prev = root.querySelectorAll(".ag-row.ag-row-hovered");
    prev.forEach((r) => r.classList.remove("ag-row-hovered"));
  }, []);

  const onGridReady = React.useCallback((params: any) => {
    gridApiRef.current = params.api;

    try {
      params.api.addEventListener("rowMouseEnter", handleRowMouseEnter);
      params.api.addEventListener("rowMouseLeave", handleRowMouseLeave);
    } catch (e) {}
  }, []);

  React.useEffect(() => {
    return () => {
      const api = gridApiRef.current;
      if (!api) return;
      try {
        api.removeEventListener("rowMouseEnter", handleRowMouseEnter);
        api.removeEventListener("rowMouseLeave", handleRowMouseLeave);
      } catch (e) {}
    };
  }, [handleRowMouseEnter, handleRowMouseLeave]);

  return (
    <div className="main-table-wrapper">
      <div className="title-row">
        <Typography variant="h5" className="title-text">
          Electric Vehicles Details
        </Typography>
      </div>

      <div className="card controls-card">
        <TextField
          label="Search"
          placeholder="Search by Brand, Model, etc."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if ((e as any).key === "Enter") handleSearch();
          }}
          size="small"
          className="search-input"
        />
        <Button
          variant="contained"
          className="search-button"
          onClick={handleSearch}
        >
          Search
        </Button>

        <div className="filter-builder" style={{ marginLeft: "auto" }}>
          <Select
            size="small"
            value={filterColumn}
            onChange={(e) => setFilterColumn((e.target as any).value)}
            displayEmpty
            className="filter-select"
            renderValue={(v: any) => v || "Column"}
          >
            <MenuItem value="" disabled>
              Column
            </MenuItem>
            {columnDefs &&
              columnDefs
                .filter((c: any) => c.field && c.field !== "actions")
                .map((col: any) => (
                  <MenuItem key={col.field} value={col.field}>
                    {col.headerName || col.field}
                  </MenuItem>
                ))}
          </Select>

          {(() => {
            const opLabels: Record<string, string> = {
              contains: "Contains",
              equals: "Equals",
              startsWith: "Starts with",
              endsWith: "Ends with",
              isEmpty: "Is empty",
              gt: "Greater than",
              lt: "Less than",
            };
            return (
              <Select
                size="small"
                value={filterOp}
                onChange={(e) => setFilterOp((e.target as any).value)}
                className="filter-select"
                renderValue={(v: any) => opLabels[v] ?? v}
              >
                <MenuItem value="contains">{opLabels.contains}</MenuItem>
                <MenuItem value="equals">{opLabels.equals}</MenuItem>
                <MenuItem value="startsWith">{opLabels.startsWith}</MenuItem>
                <MenuItem value="endsWith">{opLabels.endsWith}</MenuItem>
                <MenuItem value="isEmpty">{opLabels.isEmpty}</MenuItem>
                <MenuItem value="gt">{opLabels.gt}</MenuItem>
                <MenuItem value="lt">{opLabels.lt}</MenuItem>
              </Select>
            );
          })()}
          <TextField
            size="small"
            label="Value"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            disabled={filterOp === "isEmpty"}
            className="filter-value"
          />
          <Button
            variant="outlined"
            size="small"
            className="add-filter"
            disabled={
              !filterColumn ||
              !filterOp ||
              (filterOp !== "isEmpty" && !filterValue)
            }
            onClick={() => {
              if (
                !filterColumn ||
                !filterOp ||
                (filterOp !== "isEmpty" && !filterValue)
              )
                return;
              setFilters((f: any[]) => [
                ...f,
                {
                  column: filterColumn,
                  op: filterOp,
                  value: filterOp === "isEmpty" ? undefined : filterValue,
                },
              ]);
              setFilterColumn("");
              setFilterOp("contains");
              setFilterValue("");
            }}
          >
            Add Filter
          </Button>
        </div>
      </div>

      {filters && filters.length > 0 && (
        <div className="chips-row">
          {filters.map((f: any, idx: number) => {
            const opLabels: Record<string, string> = {
              contains: "Contains",
              equals: "Equals",
              startsWith: "Starts with",
              endsWith: "Ends with",
              isEmpty: "Is empty",
              gt: "Greater than",
              lt: "Less than",
            };
            const opLabel = opLabels[f.op] ?? f.op;
            return (
              <Chip
                key={idx}
                label={`${f.column} ${opLabel}${f.op !== "isEmpty" && f.value !== undefined ? " " + f.value : ""}`}
                size="small"
                onDelete={() =>
                  setFilters((filt: any[]) =>
                    filt.filter((_: any, i: number) => i !== idx),
                  )
                }
                className="filter-chip"
              />
            );
          })}
        </div>
      )}

      <div ref={gridRef} className="ag-container ag-theme-alpine">
        {rowData && rowData.length > 0 ? (
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{ sortable: true, resizable: true, filter: true }}
            onGridReady={onGridReady}
            pagination={false}
          />
        ) : (
          !loading && (
            <div className="no-data">
              <Typography>
                No data found. Try adjusting your search or filters.
              </Typography>
            </div>
          )
        )}
      </div>

      <div className="pagination-row"></div>
    </div>
  );
}

export {};
