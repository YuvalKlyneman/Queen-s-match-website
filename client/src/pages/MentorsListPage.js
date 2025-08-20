// client/src/pages/MentorsListPage.js

import React, { useEffect, useState, useMemo } from "react";
import { fetchMentors } from "../api/mentorsApi";
import Header from "../components/Header/Header";
import SearchBar from "../components/SearchBar/SearchBar";
import MentorGrid from "../components/MentorGrid/MentorGrid";
import MentorDetails from "../components/MentorDetails/MentorDetails";
import FilterAutoButton from "../components/FilterAutoButton";
import Footer from "../components/Footer";
/* Normalize a value to an array (handles arrays or comma-separated strings) */
function toArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return String(v)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Mentors list page:
 * - Loads mentors (from API or mock) and shows a searchable grid.
 * - Opens a modal with mentor details on card click.
 */
export default function MentorsListPage() {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(null);
    const [selTech, setSelTech] = useState([]);
    const [selLang, setSelLang] = useState([]);
    const [selDomain, setSelDomain] = useState([]);


    async function load(q) {
        setLoading(true);
        try {
            const data = await fetchMentors({ q });
            setMentors(data);
        } catch (err) {
            console.error(err);
            setMentors([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

        /* Build unique option lists from loaded mentors */
    const { techOpts, langOpts, domainOpts } = useMemo(() => {
        const techSet = new Set();
        const langSet = new Set();
        const domSet = new Set();

        mentors.forEach((m) => {
        toArray(m.technologies).forEach((t) => techSet.add(t));
        toArray(m.programmingLanguages).forEach((l) => langSet.add(l));
        toArray(m.domains).forEach((d) => domSet.add(d));
        });

        const sort = (a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" });

        return {
        techOpts: [...techSet].sort(sort),
        langOpts: [...langSet].sort(sort),
        domainOpts: [...domSet].sort(sort),
        };
    }, [mentors]);

    /* Apply text query + multi-select filters */
    const filteredMentors = useMemo(() => {
        const q = query.trim().toLowerCase();

        return mentors.filter((m) => {
        /* Text search across key fields */
        const hay = [
            m.firstName,
            m.lastName,
            m.generalDescription,
            ...toArray(m.technologies),
            ...toArray(m.programmingLanguages),
            ...toArray(m.domains),
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        if (q && !hay.includes(q)) return false;

        /* Multi-select filter match (any-of per group) */
        const mTech = toArray(m.technologies);
        const mLang = toArray(m.programmingLanguages);
        const mDom = toArray(m.domains);

        const techOk = selTech.length === 0 || selTech.some((t) => mTech.includes(t));
        const langOk = selLang.length === 0 || selLang.some((l) => mLang.includes(l));
        const domOk  = selDomain.length === 0 || selDomain.some((d) => mDom.includes(d));

        return techOk && langOk && domOk;
        });
    }, [mentors, query, selTech, selLang, selDomain]);

    function clearAllFilters() {
        setSelTech([]);
        setSelLang([]);
        setSelDomain([]);
    }

return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <div style={{ 
                maxWidth: 1100, 
                margin: "0 auto", 
                padding: "16px 16px 32px",
                flex: 1  // This makes the main content expand to fill available space
            }}>
                <h1 className="mentorsTitle">Mentors</h1>

                <SearchBar
                    onSearch={(q) => {
                        setQuery(q);
                        load(q);
                    }}
                    initialQuery={query}
                />

                <div className="filtersBar">
                    <FilterAutoButton
                        label="Technologies"
                        options={techOpts}
                        value={selTech}
                        onChange={setSelTech}
                    />
                    <FilterAutoButton
                        label="Programming Languages"
                        options={langOpts}
                        value={selLang}
                        onChange={setSelLang}
                    />
                    <FilterAutoButton
                        label="Domains"
                        options={domainOpts}
                        value={selDomain}
                        onChange={setSelDomain}
                    />
                    <button className="clearBtn" onClick={clearAllFilters}>Clear Filters</button>
                </div>

                <div style={{ marginTop: 16 }}>
                    {loading ? (
                        <div>Loading…</div>
                    ) : (
                        <MentorGrid mentors={filteredMentors} onSelect={setSelected} />
                    )}
                </div>

                {selected && (
                    <MentorDetails mentorId={selected.id} onClose={() => setSelected(null)} />
                )}
            </div>

            <Footer />
        </div>
    );
}