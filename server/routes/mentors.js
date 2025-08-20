const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Mentor = require("../models/Mentor");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

// GET /api/mentors/:id/photo - Serve mentor photo (PUBLIC ACCESS FOR MENTEES)
router.get("/:id/photo", async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    
    if (!mentor || !mentor.profilePhoto || !mentor.profilePhoto.data) {
      return res.status(404).json({ error: "Photo not found" });
    }

    res.set({
      'Content-Type': mentor.profilePhoto.contentType,
      'Content-Length': mentor.profilePhoto.data.length,
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'ETag': `"${mentor._id}-${mentor.updatedAt.getTime()}"` // Add ETag for better caching
    });

    res.send(mentor.profilePhoto.data);
    
  } catch (error) {
    console.error("Photo serving error:", error);
    res.status(500).json({ error: "Error serving photo" });
  }
});

// GET /api/mentors - View all mentors with photo URLs (REQUIRES AUTH - mentees can access)
router.get("/", requireAuth, async (req, res) => {
  try {
    // Verify the user can access mentors (mentees and mentors can view, admins too)
    if (!['mentee', 'mentor', 'admin'].includes(req.session.userType)) {
      return res.status(403).json({ 
        error: "Access denied", 
        message: "Only mentees, mentors, and admins can view mentor profiles" 
      });
    }

    const mentors = await Mentor.find({})
      .select("-userId -__v -profilePhoto")
      .sort({ createdAt: -1 });
    
    const mentorsWithPhotoUrls = mentors.map(mentor => ({
      ...mentor.toObject(),
      photoUrl: `${req.protocol}://${req.get('host')}/api/mentors/${mentor._id}/photo`,
      hasPhoto: true
    }));
    
    res.json({ 
      message: `Found ${mentors.length} mentors`,
      requestedBy: {
        userId: req.session.userId,
        userType: req.session.userType,
        email: req.session.userEmail
      },
      mentors: mentorsWithPhotoUrls
    });
  } catch (error) {
    console.error("Get mentors error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mentors/search - Search mentors with photo URLs (REQUIRES AUTH - mentees can access)
router.get("/search", requireAuth, async (req, res) => {
  try {
    // Verify the user can access mentors
    if (!['mentee', 'mentor', 'admin'].includes(req.session.userType)) {
      return res.status(403).json({ 
        error: "Access denied", 
        message: "Only mentees, mentors, and admins can search mentor profiles" 
      });
    }

    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ 
        message: "Please provide a search query",
        searchQuery: q,
        mentors: [] 
      });
    }

    const searchQuery = q.trim();
    const mentors = await Mentor.find({
      $or: [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { programmingLanguages: { $in: [new RegExp(searchQuery, 'i')] } },
        { technologies: { $in: [new RegExp(searchQuery, 'i')] } },
        { domains: { $in: [new RegExp(searchQuery, 'i')] } },
        { generalDescription: { $regex: searchQuery, $options: 'i' } }
      ]
    }).select("-userId -__v -profilePhoto");

    const mentorsWithPhotoUrls = mentors.map(mentor => ({
      ...mentor.toObject(),
      photoUrl: `${req.protocol}://${req.get('host')}/api/mentors/${mentor._id}/photo`,
      hasPhoto: true
    }));

    res.json({ 
      message: `Found ${mentors.length} mentors matching "${searchQuery}"`,
      searchQuery: searchQuery,
      requestedBy: {
        userId: req.session.userId,
        userType: req.session.userType
      },
      mentors: mentorsWithPhotoUrls
    });
  } catch (error) {
    console.error("Search mentors error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mentors/:id - Get specific mentor details with photo URL (REQUIRES AUTH - mentees can access)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    // Verify the user can access mentor details
    if (!['mentee', 'mentor', 'admin'].includes(req.session.userType)) {
      return res.status(403).json({ 
        error: "Access denied", 
        message: "Only mentees, mentors, and admins can view mentor details" 
      });
    }

    const mentor = await Mentor.findById(req.params.id).select("-userId -__v -profilePhoto");
    
    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found" });
    }
    
    const mentorWithPhoto = {
      ...mentor.toObject(),
      photoUrl: `${req.protocol}://${req.get('host')}/api/mentors/${mentor._id}/photo`,
      hasPhoto: true
    };
    
    res.json({ 
      mentor: mentorWithPhoto,
      viewedBy: {
        userId: req.session.userId,
        userType: req.session.userType
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Invalid mentor ID format" });
    }
    console.error("Get mentor details error:", error);
    res.status(500).json({ error: error.message });
  }
});
  
// PUT /api/mentors/profile - Update mentor profile (mentors only)
const uploadPhoto = require("../middleware/upload");

router.put("/profile", 
  requireRole("mentor"),
  uploadPhoto,
  [
    body("firstName").optional().notEmpty().trim().withMessage("First name cannot be empty"),
    body("lastName").optional().notEmpty().trim().withMessage("Last name cannot be empty"),
    body("email").optional().isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("yearsOfExperience").optional().isInt({ min: 0 }).withMessage("Years of experience must be a positive number"),
    body("generalDescription").optional().isLength({ max: 1000 }).withMessage("General description must be under 1000 characters"),
    body("phoneNumber").optional().notEmpty().trim().withMessage("Phone number cannot be empty"),
    body("linkedinUrl").optional().isURL().withMessage("LinkedIn URL must be valid")
  ], 
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const mentor = await Mentor.findOne({ userId: req.session.userId });
      if (!mentor) {
        return res.status(404).json({ error: "Mentor profile not found" });
      }

      // Parse arrays if they come as strings (from FormData)
      let { programmingLanguages, technologies, domains } = req.body;
      
      if (typeof programmingLanguages === 'string') {
        programmingLanguages = programmingLanguages.split(',').map(lang => lang.trim()).filter(Boolean);
      }
      if (typeof technologies === 'string') {
        technologies = technologies.split(',').map(tech => tech.trim()).filter(Boolean);
      }
      if (typeof domains === 'string') {
        domains = domains.split(',').map(domain => domain.trim()).filter(Boolean);
      }

      const {
        firstName, lastName, email, phoneNumber, yearsOfExperience,
        generalDescription, linkedinUrl
      } = req.body;

      // Update only provided fields
      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (programmingLanguages !== undefined) updateData.programmingLanguages = programmingLanguages;
      if (technologies !== undefined) updateData.technologies = technologies;
      if (domains !== undefined) updateData.domains = domains;
      if (yearsOfExperience !== undefined) updateData.yearsOfExperience = parseInt(yearsOfExperience);
      if (generalDescription !== undefined) updateData.generalDescription = generalDescription;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;

      // Update photo if provided
      if (req.file) {
        updateData.profilePhoto = {
          data: req.file.buffer,
          contentType: req.file.mimetype
        };
        updateData.photoFileName = req.file.originalname;
        
        console.log(`📸 Photo updated for mentor ${mentor._id}: ${req.file.originalname} (${req.file.size} bytes)`);
      }

      // Apply updates
      Object.assign(mentor, updateData);
      await mentor.save();

      // Return updated mentor with photo URL (include timestamp for cache busting)
      const updatedMentor = await Mentor.findOne({ userId: req.session.userId }).select("-userId -__v -profilePhoto");
      const timestamp = Date.now();
      const mentorWithPhoto = {
        ...updatedMentor.toObject(),
        photoUrl: `${req.protocol}://${req.get('host')}/api/mentors/${updatedMentor._id}/photo?v=${timestamp}`,
        hasPhoto: true,
        photoUpdated: !!req.file // Indicate if photo was updated
      };

      res.json({
        message: "Mentor profile updated successfully",
        updatedFields: Object.keys(updateData),
        mentor: mentorWithPhoto
      });

    } catch (error) {
      console.error("Update mentor profile error:", error);
      
      // Handle file upload errors
      if (error instanceof require("multer").MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
        }
        return res.status(400).json({ error: "File upload error: " + error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/mentors/my/profile - Get current mentor's own profile
router.get("/my/profile", requireRole("mentor"), async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ userId: req.session.userId }).select("-userId -__v -profilePhoto");
    
    if (!mentor) {
      return res.status(404).json({ error: "Mentor profile not found" });
    }
    
    const timestamp = Date.now();
    const mentorWithPhoto = {
      ...mentor.toObject(),
      photoUrl: `${req.protocol}://${req.get('host')}/api/mentors/${mentor._id}/photo?v=${timestamp}`,
      hasPhoto: true
    };
    
    res.json({ 
      message: "Your mentor profile",
      mentor: mentorWithPhoto
    });
  } catch (error) {
    console.error("Get own mentor profile error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;