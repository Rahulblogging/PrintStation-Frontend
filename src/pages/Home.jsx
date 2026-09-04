import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PrintForm from "../components/PrintForm";

function Home() {
  const [agentOnline, setAgentOnline] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let failedChecks = 0;

    const checkAgentStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/agent/status`);

        if (!response.ok) {
          throw new Error("Status check failed");
        }

        const data = await response.json();

        if (data.online === true) {
          failedChecks = 0;
          setAgentOnline(true);
        } else {
          failedChecks++;

          if (failedChecks >= 3) {
            setAgentOnline(false);
          }
        }
      } catch (error) {
        failedChecks++;

        if (failedChecks >= 3) {
          setAgentOnline(false);
        }
      }
    };

    // Check immediately
    checkAgentStatus();

    // Check every 5 seconds
    const interval = setInterval(checkAgentStatus, 5000);

    return () => clearInterval(interval);
  }, [API_URL]);

  return (
    <div className="app">
      <Navbar />

      <main className="home-container">
        <div className="hero">

          <div
            className={`hero-badge ${
              agentOnline ? "online" : "offline"
            }`}
          >
            <span></span>

            {agentOnline
              ? "Ready to print"
              : "Printer offline"}
          </div>

          <h1>
            Print documents
            <br />
            <span>made simple.</span>
          </h1>

          <p>
            Upload your document, choose your
            preferences, and send it to the printer
            in seconds.
          </p>
        </div>

        <PrintForm />

        <div className="security-note">
          🔒 Your document is securely handled
          and sent directly to the printing station.
        </div>
      </main>
    </div>
  );
}

export default Home;