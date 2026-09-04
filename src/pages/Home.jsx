import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PrintForm from "../components/PrintForm";

function Home() {
  const [agentOnline, setAgentOnline] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // ========================================
  // CHECK PRINT AGENT STATUS
  // ========================================

  const checkAgentStatus = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/agent/status`
      );

      const data = await response.json();

      setAgentOnline(data.online === true);
    } catch (error) {
      console.error(
        "Failed to check print agent status:",
        error
      );

      setAgentOnline(false);
    }
  };

  // ========================================
  // LIVE STATUS
  // ========================================

  useEffect(() => {
    // Check immediately
    checkAgentStatus();

    // Check every 5 seconds
    const interval = setInterval(() => {
      checkAgentStatus();
    }, 5000);

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, []);

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="app">

      <Navbar />

      <main className="home-container">

        <div className="hero">

          {/* ==================================
              PRINT AGENT STATUS
          =================================== */}

          <div
            className={`hero-badge ${
              agentOnline
                ? "online"
                : "offline"
            }`}
          >
            <span></span>

            {agentOnline
              ? "Ready to print"
              : "Printer offline"}
          </div>


          {/* ==================================
              HEADING
          =================================== */}

          <h1>
            Print documents
            <br />
            <span>made simple.</span>
          </h1>


          {/* ==================================
              DESCRIPTION
          =================================== */}

          <p>
            Upload your document, choose your
            preferences, and send it to the printer
            in seconds.
          </p>

        </div>


        {/* ==================================
            PRINT FORM
        =================================== */}

        <PrintForm />


        {/* ==================================
            SECURITY NOTE
        =================================== */}

        <div className="security-note">
          🔒 Your document is securely handled
          and sent directly to the printing station.
        </div>

      </main>

    </div>
  );
}

export default Home;