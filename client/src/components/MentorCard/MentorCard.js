// client/src/components/MentorCard/MentorCard.js

import React, { useState } from "react";
import s from "./MentorCard.module.css";
import { MailIcon, WhatsappIcon } from "../Icons";

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

function isRTL(str = "") {
    return /[\u0590-\u05FF\u0600-\u06FF]/.test(str);
}

export default function MentorCard({ mentor, onClick }) {
    const { user: currentUser } = useAuthUser();
    const [showWaMenu, setShowWaMenu] = useState(false);

    const fullName = [mentor?.firstName, mentor?.lastName].filter(Boolean).join(" ").trim() || "Mentor";
    const avatar = mentor?.photoUrl || mentor?.avatarUrl || "/avatars/default-female.png";
    const cardDir = isRTL(fullName) ? "rtl" : "ltr";
    const yearsLabel = isRTL(fullName) ? "שנות ניסיון" : "years of experience";

    // ADDED: Combine all skills for display
    const allSkills = [
        ...(mentor?.programmingLanguages || []),
        ...(mentor?.technologies || []),
        ...(mentor?.domains || [])
    ];

    // Show first 3 skills, then "+X more" if there are more
    const displaySkills = allSkills.slice(0, 3);
    const remainingCount = allSkills.length - displaySkills.length;

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick && onClick(mentor);
        }
    };

    const menteeName = currentUser?.firstName || "Mentee";
    const { subject, body } = buildEmailTemplate({ 
        mentorFirstName: mentor?.firstName || "Mentor", 
        menteeName 
    });
    const waText = buildWhatsappTemplate({ 
        mentorFirstName: mentor?.firstName || "Mentor", 
        menteeName 
    });

    const hasEmail = Boolean(mentor?.email);
    const gmailLink = hasEmail ? gmailComposeHref({ to: mentor.email, subject, body }) : null;

    const rawPhone = mentor?.phoneNumber || mentor?.phone;
    const hasPhone = Boolean(rawPhone);
    const phoneE164NoPlus = hasPhone ? toE164NoPlusIL(rawPhone) : "";
    const waLink = hasPhone && phoneE164NoPlus ? waHref(phoneE164NoPlus, waText) : null;

    return (
        <div
            className={s.card}
            role="button"
            tabIndex={0}
            aria-label={fullName}
            onClick={() => onClick && onClick(mentor)}
            onKeyDown={handleKeyDown}
            dir={cardDir}
        >
            <img className={s.avatar} src={avatar} alt={fullName} />
            <div className={s.text}>
                <div className={s.name} dir="auto">{fullName}</div>
                
                {/* UPDATED: Show multiple skills instead of just headlineTech */}
                <div className={s.skillsContainer}>
                    {displaySkills.map((skill, index) => (
                        <span key={index} className={s.skillTag}>
                            {skill}
                        </span>
                    ))}
                    {remainingCount > 0 && (
                        <span className={s.moreSkills}>
                            +{remainingCount} more
                        </span>
                    )}
                </div>

                {typeof mentor.yearsOfExperience === "number" && (
                    <div className={s.years} dir={cardDir}>
                        {mentor.yearsOfExperience} {yearsLabel}
                    </div>
                )}

                <div className={s.actions}>
                    <a
                        className={`${s.iconBtn} ${gmailLink ? "" : s.disabled}`}
                        href={gmailLink || undefined}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!gmailLink) e.preventDefault();
                        }}
                        aria-disabled={!gmailLink}
                        aria-label="Email"
                        title={gmailLink ? "Email" : "No email available"}
                    >
                        <MailIcon />
                    </a>

                    {/* WhatsApp with choice: Web/App */}
                    <div className={s.waGroup} style={{ position: "relative", display: "inline-block" }}>
                        <a
                            className={`${s.iconBtn} ${waLink ? "" : s.disabled}`}
                            href={waLink || undefined}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!waLink) { e.preventDefault(); return; }
                                e.preventDefault();
                                setShowWaMenu(v => !v);
                            }}
                            aria-disabled={!waLink}
                            aria-label="WhatsApp"
                            title={waLink ? "WhatsApp" : "No phone available"}
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
                                    zIndex: 10,
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
                </div>
            </div>
        </div>
    );
}