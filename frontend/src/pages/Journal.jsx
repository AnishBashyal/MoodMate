import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  IconButton,
  Slider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Avatar,
  Badge,
  Tooltip,
} from "@mui/material";
import { format } from "date-fns";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import FlipIcon from "@mui/icons-material/Flip";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import { auth } from "../firebase";

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({ content: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [moodScore, setMoodScore] = useState(null);
  const [summary, setSummary] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchJournals();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const fetchJournals = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();
      const response = await fetch("http://localhost:5000/journals", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch journals");
      }

      const data = await response.json();
      // Transform the data to match our component's structure
      const transformedEntries = data.map((entry, index) => ({
        id: entry.id,
        date: new Date(entry.date || Date.now()),
        title: entry.title || `Entry ${data.length - index}`,
        content: entry.text,
        moodScore: entry.mood_score,
        summary: entry.summary,
      }));
      setEntries(transformedEntries);
    } catch (err) {
      console.error("Error fetching journals:", err);
      setError("Failed to load journal entries");
    }
  };

  const handleSaveEntry = async (content) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");

      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const idToken = await user.getIdToken();

      // Save the entry with summary to the backend
      const saveResponse = await fetch("http://localhost:5000/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          journal: content,
          mood_score: moodScore,
          summary: summary,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save journal entry");
      }

      const savedEntry = await saveResponse.json();

      // Create a new entry with the data from the backend
      const entry = {
        id: savedEntry.id,
        date: new Date(),
        title: `Entry ${entries.length + 1}`,
        content: content,
        moodScore: moodScore,
        summary: summary,
      };

      // Update entries and set the new entry as selected
      setEntries([entry, ...entries]);
      setSelectedEntry(entry);
      setNewEntry({ content: "" });
      setMoodScore(null);
      setSummary("");
      setSuccessMessage("Entry saved successfully!");
    } catch (err) {
      console.error("Error saving journal:", err);
      setError(err.message || "Failed to save journal entry");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!newEntry.content) {
      setError("Please enter some content first");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");

      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const idToken = await user.getIdToken();

      const response = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ journal: newEntry.content }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setMoodScore(data.mood_score);
      setSummary(data.summary);
    } catch (err) {
      console.error("Error generating summary:", err);
      setError("Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");

      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const idToken = await user.getIdToken();

      const response = await fetch(
        `http://localhost:5000/journals/${entryToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete journal entry");
      }

      // Remove the entry from the state
      setEntries(entries.filter((entry) => entry.id !== entryToDelete.id));

      // If the deleted entry was selected, clear the selection
      if (selectedEntry && selectedEntry.id === entryToDelete.id) {
        setSelectedEntry(null);
        setIsFlipped(false);
      }

      setSuccessMessage("Entry deleted successfully!");
    } catch (err) {
      console.error("Error deleting journal:", err);
      setError("Failed to delete journal entry");
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  const getMoodEmoji = (score) => {
    if (score === null) return "😐";
    if (score >= 8) return "😊";
    if (score >= 6) return "🙂";
    if (score >= 4) return "😐";
    if (score >= 2) return "🙁";
    return "😢";
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleOpenChat = () => {
    setChatOpen(true);
    // Initialize chat with a greeting based on the entry
    if (selectedEntry) {
      const greeting = `Hi! I see you wrote about ${selectedEntry.content.substring(
        0,
        50
      )}${
        selectedEntry.content.length > 50 ? "..." : ""
      }. Would you like to talk about it?`;
      setChatMessages([
        { sender: "bot", message: greeting, timestamp: new Date() },
      ]);
    }
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setChatMessages([]);
    setUserMessage("");
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    // Add user message to chat
    const newUserMessage = {
      sender: "user",
      message: userMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, newUserMessage]);
    setUserMessage("");
    setChatLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const idToken = await user.getIdToken();

      // Send message to backend for processing
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: userMessage,
          entry_id: selectedEntry.id,
          entry_content: selectedEntry.content,
          entry_summary: selectedEntry.summary,
          entry_mood: selectedEntry.moodScore,
          conversation_history: chatMessages.map((msg) => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.message,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from chatbot");
      }

      const data = await response.json();

      // Add bot response to chat
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", message: data.response, timestamp: new Date() },
      ]);
    } catch (err) {
      console.error("Error in chat:", err);
      // Add error message to chat
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          message:
            "I'm sorry, I'm having trouble responding right now. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Left Panel - Journal Entries List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: "80vh", overflow: "auto" }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="h6">Journal Entries</Typography>
            </Box>
            <List>
              {entries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <ListItem
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteEntry(entry)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                    disablePadding
                  >
                    <ListItemButton
                      selected={selectedEntry?.id === entry.id}
                      onClick={() => {
                        setSelectedEntry(entry);
                        setIsFlipped(false);
                      }}
                    >
                      <ListItemText
                        primary={entry.title}
                        secondary={
                          <Box component="span" sx={{ display: "block" }}>
                            {format(entry.date, "MMM dd, yyyy")}
                            {entry.moodScore !== undefined && (
                              <Box component="span" sx={{ display: "block" }}>
                                Mood: {getMoodEmoji(entry.moodScore)} (
                                {entry.moodScore}/10)
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Main Content Area */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              height: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
              position: "relative",
            }}
          >
            <Typography variant="h5" gutterBottom>
              {selectedEntry ? "View Entry" : "New Entry"}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            {selectedEntry ? (
              <Card sx={{ flexGrow: 1, position: "relative" }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">{selectedEntry.title}</Typography>
                    <Box>
                      <Tooltip title="Chat about this entry">
                        <IconButton onClick={handleOpenChat} color="primary">
                          <ChatIcon />
                        </IconButton>
                      </Tooltip>
                      <IconButton onClick={handleFlipCard}>
                        <FlipIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteEntry(selectedEntry)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {format(selectedEntry.date, "MMMM d, yyyy")}
                  </Typography>

                  {!isFlipped ? (
                    <Typography
                      variant="body1"
                      sx={{ whiteSpace: "pre-wrap", my: 2 }}
                    >
                      {selectedEntry.content}
                    </Typography>
                  ) : (
                    <Box sx={{ my: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Mood Analysis
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Typography variant="body1" sx={{ mr: 2 }}>
                          Mood Score: {getMoodEmoji(selectedEntry.moodScore)}
                        </Typography>
                        <Slider
                          value={selectedEntry.moodScore}
                          min={0}
                          max={10}
                          step={1}
                          marks
                          disabled
                          sx={{ flexGrow: 1 }}
                        />
                        <Typography variant="body1" sx={{ ml: 2 }}>
                          {selectedEntry.moodScore}/10
                        </Typography>
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        Summary
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, bgcolor: "background.default" }}
                      >
                        <Typography variant="body1">
                          {selectedEntry.summary}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button variant="outlined" onClick={handleFlipCard}>
                    {isFlipped ? "Show Entry" : "Show Summary"}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ChatIcon />}
                    onClick={handleOpenChat}
                    sx={{ ml: 1 }}
                  >
                    Chat about this entry
                  </Button>
                </CardActions>
              </Card>
            ) : (
              <>
                <TextField
                  label="Content"
                  fullWidth
                  multiline
                  rows={6}
                  margin="normal"
                  value={newEntry.content}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, content: e.target.value })
                  }
                  placeholder="Write your thoughts here..."
                />

                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<SendIcon />}
                    onClick={handleGenerateSummary}
                    disabled={loading || !newEntry.content}
                  >
                    Generate Summary
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => handleSaveEntry(newEntry.content)}
                    disabled={
                      loading || !newEntry.content || moodScore === null
                    }
                  >
                    Save Entry
                  </Button>
                </Box>

                {loading && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                  >
                    <CircularProgress />
                  </Box>
                )}

                {moodScore !== null && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Mood Analysis
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Typography variant="body1" sx={{ mr: 2 }}>
                        Mood Score: {getMoodEmoji(moodScore)}
                      </Typography>
                      <Slider
                        value={moodScore}
                        min={0}
                        max={10}
                        step={1}
                        marks
                        disabled
                        sx={{ flexGrow: 1 }}
                      />
                      <Typography variant="body1" sx={{ ml: 2 }}>
                        {moodScore}/10
                      </Typography>
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      Summary
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, bgcolor: "background.default" }}
                    >
                      <Typography variant="body1">{summary}</Typography>
                    </Paper>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* New Entry Button */}
      {selectedEntry && (
        <Fab
          color="primary"
          aria-label="new entry"
          sx={{ position: "fixed", bottom: 16, right: 16 }}
          onClick={() => {
            setSelectedEntry(null);
            setNewEntry({ content: "" });
            setMoodScore(null);
            setSummary("");
            setError(null);
            setSuccessMessage("");
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Chat Dialog */}
      <Dialog
        open={chatOpen}
        onClose={handleCloseChat}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { height: "70vh" },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box component="div" sx={{ typography: "h6" }}>
            Chat about your entry
          </Box>
          <IconButton onClick={handleCloseChat} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", p: 0 }}>
          <Box
            sx={{
              flexGrow: 1,
              overflow: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {chatMessages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent:
                    msg.sender === "user" ? "flex-end" : "flex-start",
                  mb: 1,
                }}
              >
                {msg.sender === "bot" && (
                  <Avatar sx={{ bgcolor: "primary.main", mr: 1 }}>
                    <ChatIcon />
                  </Avatar>
                )}
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: "80%",
                    bgcolor:
                      msg.sender === "user" ? "primary.main" : "grey.100",
                    color: msg.sender === "user" ? "white" : "text.primary",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1">{msg.message}</Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5, opacity: 0.7 }}
                  >
                    {format(msg.timestamp, "h:mm a")}
                  </Typography>
                </Paper>
                {msg.sender === "user" && (
                  <Avatar sx={{ bgcolor: "secondary.main", ml: 1 }}>
                    {auth.currentUser?.displayName?.[0] || "U"}
                  </Avatar>
                )}
              </Box>
            ))}
            {chatLoading && (
              <Box
                sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}
              >
                <Avatar sx={{ bgcolor: "primary.main", mr: 1 }}>
                  <ChatIcon />
                </Avatar>
                <Paper sx={{ p: 2, bgcolor: "grey.100", borderRadius: 2 }}>
                  <CircularProgress size={20} />
                </Paper>
              </Box>
            )}
            <div ref={chatEndRef} />
          </Box>
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Type your message..."
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                multiline
                maxRows={3}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={!userMessage.trim() || chatLoading}
              >
                Send
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Entry</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this entry? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Journal;
