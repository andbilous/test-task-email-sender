import { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  DialogActions,
  Paper,
  Divider,
  IconButton,
  Modal,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  AutoAwesome as AIIcon,
  Send as SendIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const drawerWidth = 300;

export default function Home() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  });

  // Fetch emails on component mount
  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/emails');
      const data = await response.json();
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    }
  };

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
  };

  const handleComposeOpen = () => {
    setEmailForm({ to: '', cc: '', bcc: '', subject: '', body: '' });
    setComposeOpen(true);
  };

  const handleComposeClose = () => {
    setComposeOpen(false);
    setSelectedEmail(null);
  };

  const handleFormChange = (field, value) => {
    setEmailForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSendEmail = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm)
      });
      
      if (response.ok) {
        await fetchEmails();
        handleComposeClose();
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setAiLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/emails/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, to: emailForm.to })
      });
      
      const data = await response.json();
      setEmailForm(prev => ({
        ...prev,
        subject: data.subject,
        body: data.body
      }));
      setAiModalOpen(false);
      setAiPrompt('');
    } catch (error) {
      console.error('Failed to generate email:', error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Emails
          </Typography>
        </Box>
        <Divider />
        <List>
          {emails.map((email) => (
            <ListItem
              key={email.id}
              button
              selected={selectedEmail?.id === email.id}
              onClick={() => handleEmailSelect(email)}
              sx={{
                borderLeft: selectedEmail?.id === email.id ? '3px solid #1976d2' : 'none'
              }}
            >
              <ListItemText
                primary={email.subject || 'No Subject'}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      To: {email.to}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(email.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${drawerWidth}px` }}>
        {selectedEmail ? (
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              {selectedEmail.subject || 'No Subject'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>To:</strong> {selectedEmail.to}
            </Typography>
            {selectedEmail.cc && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>CC:</strong> {selectedEmail.cc}
              </Typography>
            )}
            {selectedEmail.bcc && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>BCC:</strong> {selectedEmail.bcc}
              </Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {selectedEmail.body}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="h6" color="text.secondary">
              Select an email to view its content
            </Typography>
          </Box>
        )}
      </Box>

      <Fab
        color="primary"
        aria-label="compose"
        onClick={handleComposeOpen}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <AddIcon />
      </Fab>

      <Dialog open={composeOpen} onClose={handleComposeClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Compose Email
          <IconButton
            onClick={handleComposeClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="To"
              value={emailForm.to}
              onChange={(e) => handleFormChange('to', e.target.value)}
              fullWidth
            />
            <TextField
              label="CC"
              value={emailForm.cc}
              onChange={(e) => handleFormChange('cc', e.target.value)}
              fullWidth
            />
            <TextField
              label="BCC"
              value={emailForm.bcc}
              onChange={(e) => handleFormChange('bcc', e.target.value)}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="Subject"
                value={emailForm.subject}
                onChange={(e) => handleFormChange('subject', e.target.value)}
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={aiLoading ? <CircularProgress size={16} /> : <AIIcon />}
                onClick={() => setAiModalOpen(true)}
                disabled={aiLoading}
                sx={{ minWidth: 120 }}
              >
                {aiLoading ? 'AI Working...' : 'AI ✨'}
              </Button>
            </Box>
            <TextField
              label="Body"
              value={emailForm.body}
              onChange={(e) => handleFormChange('body', e.target.value)}
              multiline
              rows={8}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleComposeClose}>Cancel</Button>
          <Button
            onClick={handleSendEmail}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={!emailForm.to || !emailForm.subject}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      <Modal open={aiModalOpen} onClose={() => setAiModalOpen(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}>
          <Typography variant="h6" gutterBottom>
            AI Email Assistant ✨
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Describe what your email should be about:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g., Meeting request for Tuesday, Sales pitch for our new product, Follow up on last week's discussion"
            disabled={aiLoading}
            sx={{ mt: 2, mb: 3 }}
          />
          {aiLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                AI is generating your email...
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label="Sales Assistant" size="small" variant="outlined" />
            <Chip label="Follow-up Assistant" size="small" variant="outlined" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
            <Button onClick={() => setAiModalOpen(false)} disabled={aiLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleAIGenerate}
              variant="contained"
              disabled={!aiPrompt.trim() || aiLoading}
              startIcon={aiLoading ? <CircularProgress size={20} /> : null}
            >
              {aiLoading ? 'Generating...' : 'Generate'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
