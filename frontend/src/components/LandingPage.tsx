import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Button, Box, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getItems, deleteItem } from "../services/api";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

type Filter = { column: string; op: string; value?: any };

import {
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import Table from "./table/table";
import "./landing.scss";
const background = new URL("../images/background.webp", import.meta.url).href;
const logoSrc = new URL("../images/BMW_logo.svg", import.meta.url).href;
export default function LandingPage(): JSX.Element {
  const [rowData, setRowData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const defaultColDefs = useMemo(
    () => ({ sortable: true, filter: true, resizable: true }),
    [],
  );
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterOp, setFilterOp] = useState<string>("contains");
  const [filterValue, setFilterValue] = useState<string>("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | number | null>(
    null,
  );

  useEffect(() => {
    fetchData();
  }, [page, pageSize, searchText, filters]);

  const fetchData = useCallback(
    async (pageToLoad = page, pageSizeToLoad = pageSize) => {
      setLoading(true);
      setError(null);
      try {
        const params: any = { page: pageToLoad, pageSize: pageSizeToLoad };
        if (searchText) params.q = searchText;
        if (filters && filters.length) params.filters = filters;

        const res = await getItems(params);

        const rows = res?.data || [];
        setRowData(rows);
        setTotal(res?.total ?? 0);

        if ((!columnDefs || columnDefs.length === 0) && rows.length > 0) {
          const keys = Object.keys(rows[0]).filter(
            (k) => k !== "id" && k !== "created_at",
          );
          const cols: any[] = keys.map((k, idx) => ({
            field: k,
            headerName: String(k).replace(/_/g, " ").toUpperCase(),
            pinned: k === "Brand" ? "left" : undefined,
            cellClass: k === "Brand" ? "sticky-brand" : undefined,
          }));

          cols.push({
            headerName: "ACTIONS",
            field: "actions",
            width: 150,
            pinned: "right",
            cellClass: "sticky-actions",
            sortable: false,
            resizable: false,
            cellRenderer: (params: any) => {
              const id = params.data?.id;
              return (
                <Box display="flex" gap={1} alignItems="center" height="100%">
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/item/${id}`)}
                      aria-label="View"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(id)}
                      aria-label="Delete"
                    >
                      <DeleteForeverIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            },
          });
          setColumnDefs(cols);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, searchText, filters, columnDefs, navigate],
  );

  const handleSearch = useCallback(() => {
    setPage(1);

    fetchData(1, pageSize);
  }, [fetchData, pageSize]);

  const handleDelete = useCallback(async (id: string | number) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    try {
      await deleteItem(deleteTargetId);
      setSnackbarMsg("Item deleted successfully");
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);

      await fetchData(1, pageSize);
    } catch (err: any) {
      setError(err?.message || "Failed to delete item");
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  }, [deleteTargetId, fetchData, pageSize]);

  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setPage(1);

    fetchData(1, pageSize);
  }, [fetchData, pageSize]);

  return (
    <>
      <div
        className="landing-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.1) 60%), url(${background})`,
        }}
      >
        <div className="landing-nav">
          <div className="nav-inner">
            <div>
              <img
                src={logoSrc}
                alt="BMW"
                height={70}
                width={70}
                className="logo"
              />
            </div>

            <a
              href="https://github.com/vaishmano"
              target="_blank"
              className="nav-links"
            >
              <AccountCircleIcon />
              <p className="author">Vaishnavi Manogaran</p>
            </a>
          </div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">Young used BMWs.</h1>
          <p className="hero-sub">
            Access real-time insights into BMW battery performance and vehicle
            health.
          </p>
          <Button
            className="hero-cta"
            variant="contained"
            size="small"
            onClick={() =>
              document
                .querySelector(".table-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Browse Vehicle Details
          </Button>
        </div>
      </div>
      <Box sx={{ padding: 3, background: "#f5f5f5", minHeight: "100vh" }}>
        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255, 255, 255, 0.7)",
              zIndex: 1300,
            }}
          >
            <CircularProgress sx={{ color: "#0b66b2" }} />
          </Box>
        )}

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            {snackbarMsg}
          </Alert>
        </Snackbar>

        <section className="table-section">
          <Table
            rowData={rowData}
            columnDefs={columnDefs}
            searchText={searchText}
            setSearchText={setSearchText}
            filterColumn={filterColumn}
            setFilterColumn={setFilterColumn}
            filterOp={filterOp}
            setFilterOp={setFilterOp}
            filterValue={filterValue}
            setFilterValue={setFilterValue}
            filters={filters}
            setFilters={setFilters}
            handleSearch={handleSearch}
            handleApplyFilters={handleApplyFilters}
            handleDelete={handleDelete}
            loading={loading}
          />

          <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete this item? This action cannot be
                undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCancelDelete}
                color="primary"
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                color="error"
                variant="contained"
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </section>
      </Box>
    </>
  );
}
