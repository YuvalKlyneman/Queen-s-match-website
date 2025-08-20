// client/src/api/mentorsApi.js

/**
 * Load mentors from your backend.
 * - If q is provided → GET /api/mentors/search?q=...
 * - Otherwise → GET /api/mentors
 * Returns an array of mentor view models ready for the UI.
 */
export async function fetchMentors({ q = "" } = {}) {
  // Use relative /api URLs so the proxy forwards to http://localhost:5000
  const url = q
    ? `/api/mentors/search?q=${encodeURIComponent(q)}`
    : `/api/mentors`;

  // Include credentials for session cookie
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to fetch mentors (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  const list = Array.isArray(data.mentors) ? data.mentors : [];

  // UPDATED: Include all skills arrays for the cards
  return list.map((m) => ({
    id: m._id || m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    phone: m.phoneNumber,
    phoneNumber: m.phoneNumber, // Keep both for compatibility
    generalDescription: m.generalDescription,
    yearsOfExperience: m.yearsOfExperience,
    programmingLanguages: m.programmingLanguages || [],
    technologies: m.technologies || [],
    domains: m.domains || [],
    linkedinUrl: m.linkedinUrl,
    // Photo URLs
    avatarUrl: `/api/mentors/${m._id || m.id}/photo`,
    photoUrl: `/api/mentors/${m._id || m.id}/photo`, // Keep both for compatibility
    // Keep headlineTech for backward compatibility, but now we'll show all skills
    headlineTech: m.programmingLanguages?.[0] || m.technologies?.[0] || "Developer",
  }));
}

/** Get one mentor by id (for MentorDetails) */
export async function fetchMentorById(id) {
  // Use relative /api URL
  const res = await fetch(`/api/mentors/${id}`, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to fetch mentor (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  const m = data.mentor ?? null;
  if (!m) return null;

  return {
    id: m._id || m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    phone: m.phoneNumber,
    phoneNumber: m.phoneNumber,
    generalDescription: m.generalDescription,
    yearsOfExperience: m.yearsOfExperience,
    programmingLanguages: m.programmingLanguages || [],
    technologies: m.technologies || [],
    domains: m.domains || [],
    linkedinUrl: m.linkedinUrl,
    // Photo URLs
    avatarUrl: `/api/mentors/${m._id || m.id}/photo`,
    photoUrl: `/api/mentors/${m._id || m.id}/photo`,
    headlineTech: m.programmingLanguages?.[0] || m.technologies?.[0] || "Developer",
    about: m.generalDescription, // Map to about for MentorDetails
  };
}