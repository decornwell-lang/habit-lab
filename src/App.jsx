// App: the list of pages (routes). Add a new page by adding a <Route> here.
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Step 2 adds: sign-up, log in, and the hamburger menu */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
