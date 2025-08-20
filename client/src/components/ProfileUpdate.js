import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Chip,
  Autocomplete,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import {
  PhotoCamera,
  Save,
  Person,
  Email,
  Phone,
  LinkedIn,
  Code,
  Work,
  CalendarToday,
  Description,
} from "@mui/icons-material";

import Footer from "./Footer";
import Header from "./Header/Header.jsx";

const ProfileUpdate = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    programmingLanguages: [],
    technologies: [],
    domains: [],
    yearsOfExperience: "",
    generalDescription: "",
    linkedinUrl: "",
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [initialLoading, setInitialLoading] = useState(true);
  // ADD: Cache buster for photo updates
  const [photoCacheBuster, setPhotoCacheBuster] = useState(Date.now());

  // Suggestions for autocomplete
  const programmingLanguageSuggestions = [
    "JavaScript",
    "Python",
    "Java",
    "C++",
    "C#",
    "TypeScript",
    "Go",
    "Rust",
    "PHP",
    "Ruby",
    "Swift",
    "Kotlin",
    "Scala",
    "R",
    "MATLAB",
    "SQL",
    "C",
    "Dart",
    "Haskell",
    "Perl",
    "Lua",
    "Elixir",
    "F#",
    "Clojure",
    "Erlang",
  ];

  const technologySuggestions = [
    "React",
    "Node.js",
    "Express.js",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "Firebase",
    "Redux",
    "Vue.js",
    "Angular",
    "Spring Boot",
    "Django",
    "Flask",
    "Laravel",
    "Next.js",
    "Nuxt.js",
    "GraphQL",
    "REST API",
    "Microservices",
    "Redis",
    "Elasticsearch",
    "Jenkins",
    "Git",
    "GitHub Actions",
    "Terraform",
  ];

  const domainSuggestions = [
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "DevOps",
    "Cloud Computing",
    "Cybersecurity",
    "Game Development",
    "UI/UX Design",
    "Backend Development",
    "Frontend Development",
    "Full Stack",
    "AI/ML",
    "Blockchain",
    "IoT",
    "AR/VR",
    "Fintech",
    "E-commerce",
    "EdTech",
  ];

  // Load current profile data with useCallback to fix dependency warning
  const loadCurrentProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile && data.user.userType === "mentor") {
          const profile = data.profile;
          setFormData({
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            email: profile.email || "",
            phoneNumber: profile.phoneNumber || "",
            programmingLanguages: profile.programmingLanguages || [],
            technologies: profile.technologies || [],
            domains: profile.domains || [],
            yearsOfExperience: profile.yearsOfExperience?.toString() || "",
            generalDescription: profile.generalDescription || "",
            linkedinUrl: profile.linkedinUrl || "",
          });

          // FIXED: Add cache buster to photo URL
          const photoUrl = `/api/mentors/${profile._id}/photo?v=${photoCacheBuster}`;
          setCurrentPhotoUrl(photoUrl);
        }
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load profile data" });
    } finally {
      setInitialLoading(false);
    }
  }, [photoCacheBuster]); // Include photoCacheBuster as dependency

  // Load current profile data
  useEffect(() => {
    loadCurrentProfile();
  }, [loadCurrentProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayChange = (name, newValue) => {
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "File size must be less than 5MB" });
        return;
      }

      if (!file.type.startsWith("image/")) {
        setMessage({ type: "error", text: "Please select an image file" });
        return;
      }

      setProfilePhoto(file);

      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (Array.isArray(formData[key])) {
          formDataToSend.append(key, formData[key].join(","));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (profilePhoto) {
        formDataToSend.append("profilePhoto", profilePhoto);
      }

      const response = await fetch("/api/mentors/profile", {
        method: "PUT",
        body: formDataToSend,
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        
        // FIXED: Clear photo-related state and update cache buster
        setProfilePhoto(null);
        setPhotoPreview(null);
        
        // Update cache buster to force photo reload
        const newCacheBuster = Date.now();
        setPhotoCacheBuster(newCacheBuster);
        
        // FIXED: Update current photo URL with new cache buster
        if (data.mentor && data.mentor._id) {
          const newPhotoUrl = `/api/mentors/${data.mentor._id}/photo?v=${newCacheBuster}`;
          setCurrentPhotoUrl(newPhotoUrl);
        } else {
          // Reload profile to get updated data
          await loadCurrentProfile();
        }
        
        // Clear file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          fileInput.value = '';
        }
        
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to update profile",
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage({ type: "error", text: "Network error occurred" });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  // FIXED: Use photoPreview if available, otherwise use current photo with cache buster
  const displayPhotoUrl = photoPreview || currentPhotoUrl;

  return (
    <>
      <Header />
      <Box bgcolor="background.default" minHeight="100vh" py={4}>
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
            {/* Header */}
            <Box
              bgcolor="primary.main"
              color="primary.contrastText"
              p={3}
              textAlign="center"
            >
              <Typography variant="h4" gutterBottom>
                Update Your Profile
              </Typography>
              <Typography variant="body1" opacity={0.9}>
                Keep your mentor profile up to date
              </Typography>
            </Box>

            <Box p={3}>
              {/* Alert Messages */}
              {message.text && (
                <Alert
                  severity={message.type === "success" ? "success" : "error"}
                  onClose={() => setMessage({ type: "", text: "" })}
                  sx={{ mb: 3 }}
                >
                  {message.text}
                </Alert>
              )}

              {/* Profile Photo Section */}
              <Card sx={{ mb: 3, textAlign: "center" }}>
                <CardContent>
                  <Box position="relative" display="inline-block">
                    <Avatar
                      src={displayPhotoUrl}
                      sx={{
                        width: 120,
                        height: 120,
                        mb: 2,
                        border: 4,
                        borderColor: "primary.main",
                      }}
                    >
                      <Person sx={{ fontSize: 60 }} />
                    </Avatar>
                    <IconButton
                      component="label"
                      sx={{
                        position: "absolute",
                        bottom: 16,
                        right: -8,
                        bgcolor: "primary.main",
                        color: "white",
                        "&:hover": { bgcolor: "primary.dark" },
                      }}
                    >
                      <PhotoCamera />
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={handlePhotoChange}
                      />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Click the camera icon to upload a new photo (max 5MB)
                  </Typography>
                  {/* ADDED: Show selected file name */}
                  {profilePhoto && (
                    <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                      New photo selected: {profilePhoto.name}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Form Fields */}
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Person color="primary" />
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <Person sx={{ mr: 1, color: "action.active" }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <Person sx={{ mr: 1, color: "action.active" }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <Email sx={{ mr: 1, color: "action.active" }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <Phone sx={{ mr: 1, color: "action.active" }} />
                      ),
                    }}
                  />
                </Grid>

                {/* Skills Section */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Code color="primary" />
                    Skills & Expertise
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={programmingLanguageSuggestions}
                    value={formData.programmingLanguages}
                    onChange={(event, newValue) =>
                      handleArrayChange("programmingLanguages", newValue)
                    }
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="filled"
                          color="primary"
                          label={option}
                          {...getTagProps({ index })}
                          key={index}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Programming Languages *"
                        placeholder="e.g., JavaScript, Python, Go..."
                        helperText="Type and press Enter to add custom languages"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={technologySuggestions}
                    value={formData.technologies}
                    onChange={(event, newValue) =>
                      handleArrayChange("technologies", newValue)
                    }
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="filled"
                          color="secondary"
                          label={option}
                          {...getTagProps({ index })}
                          key={index}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Technologies & Frameworks *"
                        placeholder="e.g., React, Node.js, Docker..."
                        helperText="Type and press Enter to add custom technologies"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={domainSuggestions}
                    value={formData.domains}
                    onChange={(event, newValue) =>
                      handleArrayChange("domains", newValue)
                    }
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="filled"
                          color="success"
                          label={option}
                          {...getTagProps({ index })}
                          key={index}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Domains & Specializations *"
                        placeholder="e.g., Web Development, Machine Learning..."
                        helperText="Type and press Enter to add custom domains"
                      />
                    )}
                  />
                </Grid>

                {/* Experience & Details */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Work color="primary" />
                    Experience & Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Years of Experience"
                    name="yearsOfExperience"
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    required
                    inputProps={{ min: 0 }}
                    InputProps={{
                      startAdornment: (
                        <CalendarToday sx={{ mr: 1, color: "action.active" }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="LinkedIn URL"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/your-profile"
                    InputProps={{
                      startAdornment: (
                        <LinkedIn sx={{ mr: 1, color: "action.active" }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="General Description *"
                    name="generalDescription"
                    value={formData.generalDescription}
                    onChange={handleInputChange}
                    required
                    multiline
                    rows={4}
                    inputProps={{ maxLength: 1000 }}
                    placeholder="Tell us about your experience, expertise, and what you can offer as a mentor..."
                    helperText={`${formData.generalDescription.length}/1000 characters`}
                    InputProps={{
                      startAdornment: (
                        <Description
                          sx={{
                            mr: 1,
                            color: "action.active",
                            alignSelf: "flex-start",
                            mt: 1,
                          }}
                        />
                      ),
                    }}
                  />
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={
                      loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Save />
                      )
                    }
                    sx={{
                      py: 1.5,
                      fontSize: "1.1rem",
                      background:
                        "linear-gradient(45deg, #6366f1 30%, #ec4899 90%)",
                      "&:hover": {
                        background:
                          "linear-gradient(45deg, #4f46e5 30%, #db2777 90%)",
                      },
                    }}
                  >
                    {loading ? "Updating..." : "Update Profile"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default ProfileUpdate;