import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Admin() {
  const [jobs, setJobs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // PRINT AGENT STATUS
  // ========================================

  const [agentOnline, setAgentOnline] = useState(false);

  // ========================================
  // FETCH JOBS
  // ========================================

  const fetchJobs = async (isRefresh = false, isSilent = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!isSilent) {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/jobs`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch jobs."
        );
      }

      // Backend returns the jobs directly as an array
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Failed to fetch jobs:",
        error
      );

      setError(
        "Unable to connect to PrintStation backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ========================================
  // FETCH PRINT AGENT STATUS
  // ========================================

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/agent/status`
      );

      const data = await response.json();

      if (!response.ok) {
        setAgentOnline(false);
        return;
      }

      setAgentOnline(data.online === true);
    } catch (error) {
      console.error(
        "Failed to fetch print agent status:",
        error
      );

      setAgentOnline(false);
    }
  };

  // ========================================
  // LOAD DATA WHEN PAGE OPENS
  // ========================================

  useEffect(() => {
    fetchJobs();
    fetchAgentStatus();

    // Check Print Agent every 5 seconds
    const statusInterval = setInterval(() => {
      fetchAgentStatus();
    }, 5000);

    // Refresh jobs every 5 seconds so cancellation/printing changes
    // appear automatically on the Admin dashboard.
    const jobsInterval = setInterval(() => {
      fetchJobs(false, true);
    }, 5000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(jobsInterval);
    };
  }, []);

  // ========================================
  // UPDATE JOB STATUS
  // ========================================

  const updateStatus = async (
    jobId,
    newStatus
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/jobs/${jobId}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update status."
        );
      }

      // Update job locally
      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job.jobId === jobId
            ? {
                ...job,
                status: newStatus
              }
            : job
        )
      );
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      setError(
        "Unable to update job status."
      );
    }
  };

  // ========================================
  // STATISTICS
  // ========================================

  const totalJobs = jobs.length;

  const pendingJobs = jobs.filter(
    (job) =>
      job.status === "Pending"
  ).length;

  const printingJobs = jobs.filter(
    (job) =>
      job.status === "Printing"
  ).length;

  const completedJobs = jobs.filter(
    (job) =>
      job.status === "Completed"
  ).length;

  const cancelledJobs = jobs.filter(
    (job) =>
      job.status === "Cancelled"
  ).length;

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  };

  // ========================================
  // FORMAT PRINT TYPE
  // ========================================

  const formatPrintType = (type) => {
    if (type === "black-white") {
      return "Black & White";
    }

    if (type === "color") {
      return "Color";
    }

    return type;
  };

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="admin-page">

      {/* ==================================
          NAVBAR
      =================================== */}

      <nav className="admin-navbar">

        <Link
          to="/"
          className="admin-logo"
        >
          🖨️ PrintStation
        </Link>

        <Link
          to="/"
          className="admin-back"
        >
          ← Back to Print
        </Link>

      </nav>


      {/* ==================================
          MAIN CONTENT
      =================================== */}

      <main className="admin-container">

        {/* ==================================
            HEADING
        =================================== */}

        <div className="admin-heading">

          <div>

            <div className="admin-label">
              ADMIN DASHBOARD
            </div>

            <h1>
              Print Monitoring
            </h1>

            <p>
              Monitor and manage incoming print jobs.
            </p>

          </div>


          {/* ==================================
              LIVE PRINT AGENT STATUS
          =================================== */}

          <div
            className={`system-status ${
              agentOnline
                ? "online"
                : "offline"
            }`}
          >

            <span
              className={
                agentOnline
                  ? "status-dot online-dot"
                  : "status-dot offline-dot"
              }
            ></span>

            {agentOnline
              ? "System Online"
              : "System Offline"}

          </div>

        </div>


        {/* ==================================
            ERROR
        =================================== */}

        {error && (
          <div className="admin-error">

            <span>
              ⚠
            </span>

            {error}

            <button
              onClick={() => fetchJobs()}
            >
              Retry
            </button>

          </div>
        )}


        {/* ==================================
            STATISTICS
        =================================== */}

        <div className="stats">

          {/* TOTAL */}

          <div className="stat-card">

            <div className="stat-icon">
              📋
            </div>

            <div>

              <span>
                Total Jobs
              </span>

              <strong>
                {totalJobs}
              </strong>

            </div>

          </div>


          {/* PENDING */}

          <div className="stat-card">

            <div className="stat-icon pending-icon">
              ◷
            </div>

            <div>

              <span>
                Pending
              </span>

              <strong>
                {pendingJobs}
              </strong>

            </div>

          </div>


          {/* PRINTING */}

          <div className="stat-card">

            <div className="stat-icon printing-icon">
              🖨️
            </div>

            <div>

              <span>
                Printing
              </span>

              <strong>
                {printingJobs}
              </strong>

            </div>

          </div>


          {/* COMPLETED */}

          <div className="stat-card">

            <div className="stat-icon completed-icon">
              ✓
            </div>

            <div>

              <span>
                Completed
              </span>

              <strong>
                {completedJobs}
              </strong>

            </div>

          </div>

        </div>


        {/* ==================================
            JOBS
        =================================== */}

        <section className="jobs-card">

          {/* HEADER */}

          <div className="jobs-header">

            <div>

              <h2>
                Print Jobs
              </h2>

              <p>
                Recent printing requests
              </p>

            </div>


            <button
              className="refresh-button"
              onClick={() =>
                fetchJobs(true)
              }
              disabled={refreshing}
            >

              {refreshing ? (
                <>
                  <span className="small-spinner"></span>
                  Refreshing...
                </>
              ) : (
                <>
                  ↻ Refresh
                </>
              )}

            </button>

          </div>


          {/* ==================================
              LOADING
          =================================== */}

          {loading ? (

            <div className="admin-loading">

              <div className="admin-spinner"></div>

              <p>
                Loading print jobs...
              </p>

            </div>

          ) : jobs.length === 0 ? (

            /* ==================================
                EMPTY STATE
            =================================== */

            <div className="empty-jobs">

              <div className="empty-icon">
                🖨️
              </div>

              <h3>
                No print jobs yet
              </h3>

              <p>
                Print requests will appear here.
              </p>

              <Link
                to="/"
                className="empty-print-button"
              >
                Create Print Job
              </Link>

            </div>

          ) : (

            /* ==================================
                TABLE
            =================================== */

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Job ID
                    </th>

                    <th>
                      File
                    </th>

                    <th>
                      Print Type
                    </th>

                    <th>
                      Copies
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Created
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {jobs.map((job) => (

                    <tr
                      key={job.jobId}
                    >

                      {/* JOB ID */}

                      <td>

                        <span className="job-id">
                          {job.jobId}
                        </span>

                      </td>


                      {/* FILE */}

                      <td>

                        <div className="table-file">

                          <span>
                            📄
                          </span>

                          <span
                            className="table-file-name"
                            title={job.fileName}
                          >
                            {job.fileName}
                          </span>

                        </div>

                      </td>


                      {/* TYPE */}

                      <td>

                        {formatPrintType(
                          job.printType
                        )}

                      </td>


                      {/* COPIES */}

                      <td>
                        {job.copies}
                      </td>


                      {/* STATUS */}

                      <td>

                        <select
                          className={`status-select ${job.status.toLowerCase()}`}
                          value={job.status}
                          onChange={(e) =>
                            updateStatus(
                              job.jobId,
                              e.target.value
                            )
                          }
                        >

                          <option value="Pending">
                            Pending
                          </option>

                          <option value="Printing">
                            Printing
                          </option>

                          <option value="Completed">
                            Completed
                          </option>

                          <option value="Failed">
                            Failed
                          </option>

                          <option value="Cancelled">
                            Cancelled
                          </option>

                        </select>

                      </td>


                      {/* CREATED */}

                      <td>

                        <span className="created-time">
                          {formatDate(
                            job.createdAt
                          )}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Admin;