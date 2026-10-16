// App: the list of pages (routes). Add a new page by adding a <Route> here.
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import Join from "./pages/Join.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Account from "./pages/Account.jsx";
import Admin from "./pages/Admin.jsx";
import InfoPage from "./pages/InfoPage.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Every page inside Layout gets the header and hamburger menu */}
        <Route element={<Layout />}>
          {/* Public pages (text is in src/content/pages.js) */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<InfoPage name="about" />} />
          <Route path="/contact" element={<InfoPage name="contact" />} />
          <Route path="/habit-lab" element={<InfoPage name="habitLab" />} />
          <Route path="/offerings" element={<InfoPage name="offerings" />} />
          <Route path="/terms" element={<InfoPage name="terms" />} />
          <Route path="/join/:cohortId" element={<Join />} />

          {/* Members-only pages */}
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />

          {/* Owner-only */}
          <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />

          <Route path="*" element={<PlaceholderPage title="Page not found">Sorry, we couldn't find that page.</PlaceholderPage>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
