import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { auth } from "../firebase";
import { format } from "date-fns";
import MoodGraph from "../components/MoodGraph";

const Dashboard = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchJournals();
    const user = auth.currentUser;
    if (user) {
      const displayName = user.displayName;
      if (displayName) {
        setUserName(displayName);
      } else {
        const emailUsername = user.email.split("@")[0];
        setUserName(emailUsername);
      }
    }
  }, []);

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
      const transformedEntries = data.map((entry) => ({
        id: entry.id,
        date: new Date(entry.date || Date.now()),
        title:
          entry.title ||
          `Entry ${format(new Date(entry.date || Date.now()), "MMM dd, yyyy")}`,
        content: entry.text,
        moodScore: entry.mood_score,
        summary: entry.summary,
      }));
      setEntries(transformedEntries);
    } catch (err) {
      console.error("Error fetching journals:", err);
    } finally {
      setLoading(false);
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

  const getMoodTrend = () => {
    if (entries.length < 2) return "stable";
    const recentEntries = entries.slice(0, 3);
    const scores = recentEntries.map((entry) => entry.moodScore);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const latest = scores[0];
    if (latest > avg + 1) return "improving";
    if (latest < avg - 1) return "declining";
    return "stable";
  };

  const getCurrentMood = () => {
    if (entries.length === 0) return null;

    // Calculate average mood score from all entries
    const totalScore = entries.reduce((sum, entry) => sum + entry.moodScore, 0);
    const averageScore = Math.round(totalScore / entries.length);

    return {
      score: averageScore,
      emoji: getMoodEmoji(averageScore),
    };
  };

  const currentMood = getCurrentMood();
  const moodTrend = getMoodTrend();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {userName}! 👋
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {format(new Date(), "MMMM d, yyyy")}
      </Typography>

      <Grid container spacing={3}>
        {/* Current Mood Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Current Mood
            </Typography>
            {currentMood ? (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="h2" sx={{ mb: 1 }}>
                  {currentMood.emoji}
                </Typography>
                <Typography variant="h4" color="primary">
                  {currentMood.score}/10
                </Typography>
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No mood data available
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Mood Trend Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Mood Trend
            </Typography>
            <Box sx={{ textAlign: "center", py: 2 }}>
              <TrendingUpIcon
                sx={{
                  fontSize: 40,
                  color:
                    moodTrend === "improving"
                      ? "success.main"
                      : moodTrend === "declining"
                      ? "error.main"
                      : "warning.main",
                }}
              />
              <Typography
                variant="h6"
                color={
                  moodTrend === "improving"
                    ? "success.main"
                    : moodTrend === "declining"
                    ? "error.main"
                    : "warning.main"
                }
                sx={{ mt: 1 }}
              >
                {moodTrend.charAt(0).toUpperCase() + moodTrend.slice(1)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Total Entries Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Total Entries
            </Typography>
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h3" color="primary">
                {entries.length}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Journal entries
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Mood Graph */}
        <Grid item xs={12}>
          <MoodGraph entries={entries} />
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Recent Activity</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/journal")}
              >
                New Entry
              </Button>
            </Box>
            {entries.length > 0 ? (
              <List>
                {entries.slice(0, 5).map((entry) => (
                  <React.Fragment key={entry.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {entry.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {format(entry.date, "MMMM d, yyyy")}
                            </Typography>
                            <br />
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                            >
                              Mood: {getMoodEmoji(entry.moodScore)} (
                              {entry.moodScore}/10)
                            </Typography>
                            <br />
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {entry.summary}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No journal entries yet. Start by creating your first entry!
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
