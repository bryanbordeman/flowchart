import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

export default function DecisionSelector({ open, onSelect, onCancel }) {
    return (
        <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
            <DialogTitle>Choose Connection Type</DialogTitle>
            <DialogContent>
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
                        variant="contained"
                        color="success"
                        onClick={() => onSelect("yes")}
                    >
                        Yes
                    </Button>
                    <Button
                        variant="contained"
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
        </Dialog>
    );
}
