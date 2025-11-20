import React, { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { getItem, deleteItem } from "../../services/api";
import "./details.scss";
const background = new URL("../../images/background.webp", import.meta.url)
  .href;

interface DetailsViewProps {
  id: string | undefined;
  onBack: () => void;
}

export default function DetailsView({
  id,
  onBack,
}: DetailsViewProps): JSX.Element {
  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getItem(id);
        setItem(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load item");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const fmt = (k: string, v: any) => {
    if (v === null || v === undefined || v === "") return "-";
    if (k === "PriceEuro") return `€${Number(v).toLocaleString()}`;
    if (k === "Range_Km" || k === "TopSpeed_KmH") return `${v}`;
    return String(v);
  };

  return (
    <div className="details-container">
      <div
        className="details-bg"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.05) 100%), url(${background})`,
        }}
      />

      <div className="details-container_inside">
        <Box className="details-back-button">
          <Button variant="contained" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteDialogOpen(true)}
            sx={{
              ml: 1,

              "&:hover": {
                bgcolor: "#940808ff !important",
                borderColor: "#940808ff !important",
                color: "#fff !important",
              },
            }}
          >
            Delete
          </Button>
        </Box>

        {loading && (
          <Box className="details-loading">
            <CircularProgress className="loading-spinner" />
          </Box>
        )}

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            className="details-error"
          >
            {error}
          </Alert>
        </Snackbar>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="delete-confirm-dialog"
        >
          <DialogTitle id="delete-confirm-dialog">Confirm delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to permanently delete this item? This action
              cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              color="error"
              onClick={async () => {
                if (!id) return;
                setDeleteLoading(true);
                try {
                  await deleteItem(id);

                  navigate("/");
                } catch (err: any) {
                  setError(err?.message || "Failed to delete item");
                } finally {
                  setDeleteLoading(false);
                  setDeleteDialogOpen(false);
                }
              }}
            >
              {deleteLoading ? <CircularProgress size={20} /> : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {!loading &&
          (item ? (
            <Card className="details-card">
              <CardContent>
                <Box className="details-header">
                  <Box className="details-title-section">
                    <p className="details-title">
                      {item.Brand || ""} {item.Model || ""}
                    </p>
                    <Box className="details-tags">
                      {item.Segment && (
                        <Box className="details-chip">{item.Segment}</Box>
                      )}
                      {item.BodyStyle && (
                        <Box className="details-chip">{item.BodyStyle}</Box>
                      )}
                    </Box>
                    <p className="details-subtitle">
                      {item.PowerTrain
                        ? `${item.PowerTrain} • ${item.PlugType || ""}`
                        : ""}
                    </p>
                  </Box>
                  <Box className="details-price-section">
                    <p className="details-price">
                      {fmt("PriceEuro", item.PriceEuro)}
                    </p>
                  </Box>
                </Box>

                <Box className="details-divider" />

                <Box className="details-specs">
                  {[
                    "Range_Km",
                    "Efficiency_WhKm",
                    "AccelSec",
                    "TopSpeed_KmH",
                    "FastCharge_KmH",
                    "Seats",
                    "Date",
                  ].map((k) => (
                    <Box key={k} className="details-spec-item">
                      <p className="spec-label">{k.replace(/_/g, " ")}</p>
                      <p className="spec-value">{fmt(k, item[k])}</p>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Box className="details-empty">No item data to display.</Box>
          ))}
      </div>
    </div>
  );
}
