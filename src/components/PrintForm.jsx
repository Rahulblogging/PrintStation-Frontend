import { useEffect, useRef, useState } from "react";

function PrintForm() {
  const [file, setFile] = useState(null);
  const [printType, setPrintType] = useState("black-white");
  const [copies, setCopies] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agentOnline, setAgentOnline] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let failedChecks = 0;

    const checkAgentStatus = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/agent/status`
        );

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

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    setMessage("");
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png"
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(
        "Only PDF, JPG, JPEG and PNG files are allowed."
      );

      event.target.value = "";
      setFile(null);
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("File size must be less than 20 MB.");

      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handlePrint = async () => {
    setMessage("");
    setError("");

    if (!file) {
      setError("Please select a file.");
      return;
    }

    if (!agentOnline) {
      setError(
        "Printer is offline. Please start the Print Agent first."
      );
      return;
    }

    try {
      setLoading(true);

      // Final printer status check before sending
      const statusResponse = await fetch(
        `${API_URL}/api/agent/status`
      );

      if (!statusResponse.ok) {
        throw new Error("Unable to check printer status.");
      }

      const statusData = await statusResponse.json();

      if (statusData.online !== true) {
        setAgentOnline(false);

        setError(
          "Printer is offline. Please start the Print Agent first."
        );

        return;
      }

      const formData = new FormData();

      formData.append("file", file);
      formData.append("printType", printType);
      formData.append("copies", copies);

      const response = await fetch(
        `${API_URL}/api/print`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to send print request."
        );
      }

      setMessage(
        "🔒 Printed successfully. File securely deleted."
      );

      setFile(null);
      setCopies(1);
      setPrintType("black-white");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Keep printer shown as online after successful print
      setAgentOnline(true);

    } catch (error) {
      console.error("Print error:", error);

      setError(
        error.message ||
        "Something went wrong while sending the print request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="print-form">

      <div className="form-group">
        <label>Select document</label>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          disabled={!agentOnline || loading}
        />
      </div>

      {file && (
        <div className="selected-file">
          📄 {file.name}
        </div>
      )}

      <div className="form-group">
        <label>Print type</label>

        <select
          value={printType}
          onChange={(e) => setPrintType(e.target.value)}
          disabled={!agentOnline || loading}
        >
          <option value="black-white">
            Black & White
          </option>

          <option value="color">
            Color
          </option>
        </select>
      </div>

      <div className="form-group">
        <label>Copies</label>

        <input
          type="number"
          min="1"
          max="100"
          value={copies}
          onChange={(e) => setCopies(e.target.value)}
          disabled={!agentOnline || loading}
        />
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={handlePrint}
        disabled={
          loading ||
          !file ||
          !agentOnline
        }
      >
        {loading
          ? "Sending request..."
          : !agentOnline
          ? "🔴 Printer Offline"
          : "🖨️ Send to Printer"}
      </button>

    </div>
  );
}

export default PrintForm;