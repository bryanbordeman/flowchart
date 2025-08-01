import * as React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialogContent-root": {
        padding: theme.spacing(2),
    },
    "& .MuiDialogActions-root": {
        padding: theme.spacing(1),
    },
}));

export default function DecisionSelector({ open, onSelect, onCancel }) {
    return (
        <BootstrapDialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            aria-labelledby="customized-dialog-title"
        >
            <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                Choose Connection Type
            </DialogTitle>
            <IconButton
                aria-label="close"
                onClick={onCancel}
                sx={(theme) => ({
                    position: "absolute",
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
            >
                <CloseIcon />
            </IconButton>
            <DialogContent dividers>
                <Typography gutterBottom>
                    Select the type of connection from the decision:
                </Typography>
                <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="center"
                    sx={{ mt: 2 }}
                >
                    <Button
                        sx={{ width: "80px" }}
                        startIcon={<CheckIcon />}
                        variant="outlined"
                        color="success"
                        onClick={() => onSelect("yes")}
                    >
                        Yes
                    </Button>
                    <Button
                        sx={{ width: "80px" }}
                        startIcon={<ClearIcon />}
                        variant="outlined"
                        color="error"
                        onClick={() => onSelect("no")}
                    >
                        No
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="primary" variant="outlined">
                    Cancel
                </Button>
            </DialogActions>
        </BootstrapDialog>
    );
}
