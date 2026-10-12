// App: the list of pages (routes). Add a new page by adding a <Route> here.
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Every page inside Layout gets the header and hamburger menu */}
        <Route element={<Layout />}>
          {/* Public pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<PlaceholderPage eyebrow="About" title="David Ernest Cornwell">David's bio, credentials and approach will go here.</PlaceholderPage>} />
          <Route path="/contact" element={<PlaceholderPage title="Contact">Contact details will go here.</PlaceholderPage>} />
          <Route path="/habit-lab" element={<PlaceholderPage title="The Habit Lab">More about how The Habit Lab works will go here.</PlaceholderPage>} />
          <Route path="/offerings" element={<PlaceholderPage title="Offerings & Retreats">Upcoming offerings and retreats will go here.</PlaceholderPage>} />

          {/* Members-only pages */}
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />

          <Route path="*" element={<PlaceholderPage title="Page not found">Sorry, we couldn't find that page.</PlaceholderPage>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
