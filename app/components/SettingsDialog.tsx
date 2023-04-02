import { Dialog, DialogTitle, DialogContent, FormControlLabel, Switch, TextField, DialogActions, Button, InputAdornment, IconButton } from "@mui/material"
import { FC, useEffect, useState } from "react"
import { getLocalSettings, setLocalSettings } from "../utils/settings"
import LogoutIcon from '@mui/icons-material/Logout';

export const SettingsDialog: FC<{ open: boolean, onClose: () => void }> = (props) => {
  const { open, onClose } = props

  const [settings, setSettings] = useState(getLocalSettings())

  const userType = localStorage.getItem('userType')
  useEffect(() => {
    setSettings(getLocalSettings())
  }, [open])

  const handleApply = () => {
    setLocalSettings(settings)
    onClose()
  }
  const handleLogout = () => {
    localStorage.removeItem('password')
    location.reload()
  }

  return <Dialog
    open={open}
    onClose={onClose}
  >
    <DialogTitle >
      Settings
    </DialogTitle>
    <DialogContent>
      <FormControlLabel
        sx={{ mb: 2 }}
        control={<Switch />} label="Conversation"
        checked={settings.isConversation}
        onChange={(evt, checked) => setSettings(prev => ({ ...prev, isConversation: checked }))}
      />

      <TextField fullWidth multiline label="System Message"
        sx={{ mb: 2 }}
        value={settings.systemMessage}
        onChange={(evt) => setSettings(prev => ({ ...prev, systemMessage: evt.target.value }))}
      />

      <TextField fullWidth label="User Type" disabled value={userType} InputProps={{
        endAdornment: <InputAdornment position="end">
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            onClick={handleLogout}
          >
            <LogoutIcon />
          </IconButton>
        </InputAdornment>,
      }} />

    </DialogContent>
    <DialogActions>
      <Button onClick={() => onClose()}>Cancel</Button>
      <Button autoFocus onClick={handleApply}>
        Apply
      </Button>
    </DialogActions>
  </Dialog>
}
