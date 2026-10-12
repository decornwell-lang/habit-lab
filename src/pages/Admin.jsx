// Admin dashboard (owner only): members, cohorts, content and check-ins.
import { useCallback, useEffect, useState } from "react";
import {
  getAllUsers, getAllPublicProfiles, getAllMemberships, getCohorts, getContentSettings,
} from "../lib/data.js";
import MembersTab from "../components/admin/MembersTab.jsx";
import CohortsTab from "../components/admin/CohortsTab.jsx";
import ContentTab from "../components/admin/ContentTab.jsx";
import CheckinsTab from "../components/admin/CheckinsTab.jsx";
import MessagesTab from "../components/admin/MessagesTab.jsx";

const TABS = ["Members", "Cohorts", "Content", "Check-ins", "Messages"];

export default function Admin() {
  const [tab, setTab] = useState("Members");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selectedUid, setSelectedUid] = useState("");

  const load = useCallback(async () => {
    try {
      const [users, profiles, memberships, cohorts, settings] = await Promise.all([
        getAllUsers(), getAllPublicProfiles(), getAllMemberships(), getCohorts(), getContentSettings(),
      ]);
      setData({ users, profiles, memberships, cohorts, settings });
    } catch (err) {
      console.error(err);
      setError("Couldn't load admin data. Check that your account has the admin role and the latest security rules are published.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="page page-wide">
      <p className="eyebrow">Admin</p>
      <h1>Admin</h1>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      {!data && !error && <p className="muted">Loading…</p>}

      {data && tab === "Members" && (
        <MembersTab
          data={data}
          reload={load}
          onViewCheckins={(uid) => {
            setSelectedUid(uid);
            setTab("Check-ins");
          }}
        />
      )}
      {data && tab === "Cohorts" && <CohortsTab cohorts={data.cohorts} reload={load} />}
      {data && tab === "Content" && <ContentTab settings={data.settings} reload={load} />}
      {data && tab === "Check-ins" && <CheckinsTab data={data} selectedUid={selectedUid} setSelectedUid={setSelectedUid} />}
      {data && tab === "Messages" && <MessagesTab cohorts={data.cohorts} users={data.users} />}
    </main>
  );
}
