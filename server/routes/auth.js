// POST /api/auth/register-mentor - RESOLVED VERSION
router.post("/register-mentor", 
  uploadPhoto,        
  mentorValidation,   
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ 
          error: "Profile photo is required",
          message: "Please upload a profile photo" 
        });
      }

      let { programmingLanguages, technologies, domains } = req.body;
      
      if (typeof programmingLanguages === 'string') {
        programmingLanguages = programmingLanguages.split(',').map(lang => lang.trim());
      }
      if (typeof technologies === 'string') {
        technologies = technologies.split(',').map(tech => tech.trim());
      }
      if (typeof domains === 'string') {
        domains = domains.split(',').map(domain => domain.trim());
      }

      const {
        email, password, firstName, lastName, yearsOfExperience,
        generalDescription, phoneNumber, linkedinUrl
      } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // CREATE USER WITH EMAIL VERIFICATION
      const user = new User({
        email,
        password,
        userType: "mentor",
        isEmailVerified: false // Start as unverified
      });

      // Generate verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // CREATE MENTOR PROFILE
      const mentor = new Mentor({
        userId: user._id,
        firstName,
        lastName,
        programmingLanguages,
        technologies,
        domains,
        yearsOfExperience: parseInt(yearsOfExperience),
        generalDescription,
        email,
        phoneNumber,
        linkedinUrl,
        profilePhoto: {
          data: req.file.buffer,
          contentType: req.file.mimetype
        },
        photoFileName: req.file.originalname
      });

      await mentor.save();

      // SEND VERIFICATION EMAIL
      const emailResult = await sendVerificationEmail(email, firstName, verificationToken);
      
      if (!emailResult.success) {
        console.error("Failed to send verification email:", emailResult.error);
        // Don't fail registration if email fails - just log it
      }

      // SET SESSION WITH NAMES (from remote changes)
      req.session.userId = user._id;
      req.session.userType = user.userType;
      req.session.userEmail = user.email;
      req.session.userFirstName = mentor.firstName || null;
      req.session.userLastName = mentor.lastName || null;

      res.status(201).json({
        message: "Mentor registered successfully! Please check your email to verify your account.",
        user: {
          id: user._id,
          email: user.email,
          userType: user.userType,
          isEmailVerified: user.isEmailVerified, // Keep email verification
          firstName: mentor.firstName,           // Keep names
          lastName: mentor.lastName
        },
        mentor: {
          id: mentor._id,
          firstName: mentor.firstName,
          lastName: mentor.lastName,
          hasProfilePhoto: true
        },
        emailSent: emailResult.success, // Keep email verification
        nextStep: "Please check your email and click the verification link to activate your account."
      });

    } catch (error) {
      console.error("Mentor registration error:", error);
      
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
        }
        return res.status(400).json({ error: "File upload error: " + error.message });
      }
      
      res.status(500).json({ error: "Server error during registration" });
    }
  }
);