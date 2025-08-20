// client/src/components/MentorDetails/MentorDetails.js

import React, { useEffect, useState } from "react";
import { fetchMentorById } from "../../api/mentorsApi";
import s from "./MentorDetails.module.css";
import { MailIcon, PhoneIcon, WhatsappIcon, LinkedinIcon } from "../Icons";

import {
    toE164NoPlusIL,
    buildEmailTemplate,
    buildWhatsappTemplate,
    gmailComposeHref,
    waHref,
    openWhatsAppWeb,
    openWhatsAppApp,
} from "../../utils/contactTemplates";

import useAuthUser from "../../hooks/useAuthUser";

function isRTL(str = "") { return /[\u0590-\u05FF\u0600-\u06FF]/.test(str); }

export default function MentorDetails({ mentorId, onClose }) {
    const [mentor, setMentor] = useState(null);
    const { user: currentUser } = useAuthUser();
    const [showWaMenu, setShowWaMenu] = useState(false);

    useEffect(() => { fetchMentorById(mentorId).then(setMentor); }, [mentorId]);

    if (!mentor) return null;

    const fullName  = [mentor.firstName, mentor.lastName].filter(Boolean).join(" ").trim() || "Mentor";
    const aboutText = mentor.about || "";

    const isRtlContext = isRTL(aboutText) || isRTL(fullName);
    const textDir      = isRtlContext ? "rtl" : "ltr";
    const layoutClass  = isRtlContext ? s.rtl : s.ltr;

    const aboutLabel   = isRtlContext ? `על ${mentor.firstName}` : `About ${mentor.firstName}`;
    const contactLabel = isRtlContext ? `צרי קשר עם ${mentor.firstName}` : `Contact ${mentor.firstName}`;
    const yearsLabel   = isRtlContext ? "שנות ניסיון" : "years of experience";
    const skillsLabel  = isRtlContext ? "כישורים וטכנולוגיות" : "Skills & Technologies";
    const programmingLabel = isRtlContext ? "שפות תכנות" : "Programming Languages";
    const technologiesLabel = isRtlContext ? "טכנולוגיות" : "Technologies";
    const domainsLabel = isRtlContext ? "תחומים" : "Domains";

    const avatar   = mentor.photoUrl || mentor.avatarUrl || "/avatars/default-female.png";

    const menteeName = currentUser?.firstName || "Mentee";
    const { subject, body } = buildEmailTemplate({ 
        mentorFirstName: mentor?.firstName || "Mentor", 
        menteeName 
    });
    const waText = buildWhatsappTemplate({ 
        mentorFirstName: mentor?.firstName || "Mentor", 
        menteeName 
    });

    const emailHref = mentor?.email ? gmailComposeHref({ to: mentor.email, subject, body }) : undefined;

    // phoneNumber or phone
    const rawPhone = mentor?.phoneNumber || mentor?.phone;
    const phoneHref = rawPhone ? `tel:${rawPhone}` : undefined;

    const hasPhone = Boolean(rawPhone);
    const phoneE164NoPlus = hasPhone ? toE164NoPlusIL(rawPhone) : "";
    const waHrefFinal = hasPhone && phoneE164NoPlus ? waHref(phoneE164NoPlus, waText) : undefined;

    // Get all skills
    const programmingLanguages = mentor.programmingLanguages || [];
    const technologies = mentor.technologies || [];
    const domains = mentor.domains || [];

    return (
        <div className={s.backdrop} onClick={onClose}>
            <div className={`${s.panel} ${layoutClass}`} onClick={(e) => e.stopPropagation()}>
                <button className={s.close} onClick={onClose} aria-label="סגירה">✕</button>

                <img className={s.avatar} src={avatar} alt={fullName} />

                <div className={s.content} dir={textDir}>
                    <div className={s.nameRow}>
                        {mentor.linkedinUrl && (
                            <a href={mentor.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                                <LinkedinIcon />
                            </a>
                        )}
                        <div className={s.name} dir="auto">{fullName}</div>
                    </div>

                    <div className={s.head} dir={textDir}>{mentor.headlineTech}</div>

                    {typeof mentor.yearsOfExperience === "number" && (
                        <div className={s.years}>
                            {mentor.yearsOfExperience} {yearsLabel}
                        </div>
                    )}

                    {/* ADDED: Skills Section */}
                    {(programmingLanguages.length > 0 || technologies.length > 0 || domains.length > 0) && (
                        <div className={s.skillsSection}>
                            <div className={s.sectionTitle}>{skillsLabel}</div>
                            
                            {programmingLanguages.length > 0 && (
                                <div className={s.skillCategory}>
                                    <div className={s.skillCategoryTitle}>{programmingLabel}</div>
                                    <div className={s.skillTags}>
                                        {programmingLanguages.map((skill, index) => (
                                            <span key={index} className={`${s.skillTag} ${s.programmingTag}`}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {technologies.length > 0 && (
                                <div className={s.skillCategory}>
                                    <div className={s.skillCategoryTitle}>{technologiesLabel}</div>
                                    <div className={s.skillTags}>
                                        {technologies.map((skill, index) => (
                                            <span key={index} className={`${s.skillTag} ${s.technologyTag}`}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {domains.length > 0 && (
                                <div className={s.skillCategory}>
                                    <div className={s.skillCategoryTitle}>{domainsLabel}</div>
                                    <div className={s.skillTags}>
                                        {domains.map((skill, index) => (
                                            <span key={index} className={`${s.skillTag} ${s.domainTag}`}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!!aboutText && (() => {
                        const lines = aboutText.split("•").map(l => l.trim()).filter(Boolean);
                        return (
                            <div>
                                <div className={s.sectionTitle}>{aboutLabel}</div>
                                <ul className={s.aboutList} dir={textDir}>
                                    {lines.map((line, i) => <li key={i}>{line}</li>)}
                                </ul>
                            </div>
                        );
                    })()}

                    <div className={s.contactTitle}>{contactLabel}</div>
                    <div className={s.row}>
                        {emailHref && (
                            <a
                                className={s.iconBtn}
                                href={emailHref}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => { e.stopPropagation(); }}
                                aria-label="Email"
                            >
                                <MailIcon />
                            </a>
                        )}

                        {phoneHref && (
                            <a
                                className={s.iconBtn}
                                href={phoneHref}
                                onClick={(e) => { e.stopPropagation(); }}
                                aria-label="Phone"
                            >
                                <PhoneIcon />
                            </a>
                        )}

                        {waHrefFinal && (
                            <div className={s.waGroup} style={{ position: "relative", display: "inline-block" }}>
                                <a
                                    className={s.iconBtn}
                                    href={waHrefFinal}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowWaMenu(v => !v); }}
                                    aria-label="WhatsApp"
                                >
                                    <WhatsappIcon />
                                </a>

                                {showWaMenu && (
                                    <div
                                        role="menu"
                                        className={s.waMenu}
                                        style={{
                                            position: "absolute",
                                            top: "48px",
                                            insetInlineStart: 0,
                                            background: "#fff",
                                            border: "1px solid #f1d3da",
                                            borderRadius: 10,
                                            boxShadow: "0 6px 18px rgba(0,0,0,.12)",
                                            padding: 8,
                                            zIndex: 20,
                                            minWidth: 160
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await openWhatsAppWeb(phoneE164NoPlus, waText);
                                                setShowWaMenu(false);
                                            }}
                                            style={{ display: "block", width: "100%", background: "transparent", border: "none", padding: "8px 10px", cursor: "pointer", textAlign: "start" }}
                                        >
                                            Open in Web
                                        </button>
                                        <button
                                            type="button"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await openWhatsAppApp(phoneE164NoPlus, waText);
                                                setShowWaMenu(false);
                                            }}
                                            style={{ display: "block", width: "100%", background: "transparent", border: "none", padding: "8px 10px", cursor: "pointer", textAlign: "start" }}
                                        >
                                            Open in App
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {mentor.linkedinUrl && (
                            <a className={s.iconBtn} href={mentor.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn" onClick={(e)=>e.stopPropagation()}>
                                <LinkedinIcon />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}