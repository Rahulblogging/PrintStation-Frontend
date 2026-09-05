import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function PrintForm() {
  // ========================================
  // BASIC PRINT STATE
  // ========================================

  const [file, setFile] = useState(null);
  const [printType, setPrintType] = useState("black-white");
  const [copies, setCopies] = useState(1);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [agentOnline, setAgentOnline] = useState(false);

  // ========================================
  // PRINT JOB / CANCELLATION
  // ========================================

  const [jobId, setJobId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelRequested, setCancelRequested] =
    useState(false);

  // Ref is used because state updates are asynchronous.
  // This lets handlePrint know if Cancel was clicked
  // while the upload request was still running.
  const cancelRequestedRef = useRef(false);

  // ========================================
  // MORE OPTIONS
  // ========================================

  const [moreOptions, setMoreOptions] =
    useState(false);

  const [orientation, setOrientation] =
    useState("portrait");

  const [paperSize, setPaperSize] =
    useState("A4");

  const [fit, setFit] =
    useState("shrink-to-fit");

  const [pageMargins, setPageMargins] =
    useState("uniform");

  const [pageSelection, setPageSelection] =
    useState("all");

  const [pageRange, setPageRange] =
    useState("");

  // ========================================
  // PDF PREVIEW
  // ========================================

  const [previewUrl, setPreviewUrl] =
    useState(null);

  const [previewPage, setPreviewPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(0);

  const previewCanvasRef =
    useRef(null);

  // ========================================
  // FILE INPUT
  // ========================================

  const fileInputRef = useRef(null);

  const API_URL =
    import.meta.env.VITE_API_URL;

  // ========================================
  // CHECK PRINT AGENT STATUS
  // ========================================

  const checkAgentStatus = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/agent/status`
      );

      const data = await response.json();

      setAgentOnline(
        data.online === true
      );
    } catch (error) {
      console.error(
        "Agent status check error:",
        error
      );

      // Do not immediately show offline
      // for a temporary network error.
    }
  };

  // ========================================
  // MONITOR PRINT AGENT
  // ========================================

  useEffect(() => {
    checkAgentStatus();

    const interval = setInterval(() => {
      checkAgentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ========================================
  // FILE SELECTION
  // ========================================

  const handleFileChange = async (e) => {
    const selectedFile =
      e.target.files[0];

    if (!selectedFile) {
      return;
    }

    // ----------------------------------------
    // FILE SIZE
    // ----------------------------------------

    if (
      selectedFile.size >
      20 * 1024 * 1024
    ) {
      setMessage(
        "File size must be less than 20 MB."
      );

      e.target.value = "";

      return;
    }

    // ----------------------------------------
    // FILE TYPE
    // ----------------------------------------

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    const extension =
      selectedFile.name
        .split(".")
        .pop()
        .toLowerCase();

    const allowedExtensions = [
      "pdf",
      "jpg",
      "jpeg",
      "png",
    ];

    if (
      !allowedTypes.includes(
        selectedFile.type
      ) &&
      !allowedExtensions.includes(
        extension
      )
    ) {
      setMessage(
        "Only PDF, JPG, JPEG and PNG files are allowed."
      );

      e.target.value = "";

      return;
    }

    setFile(selectedFile);
    setMessage("");

    // Reset preview
    setPreviewUrl(null);
    setPreviewPage(1);
    setTotalPages(0);

    // ----------------------------------------
    // CREATE PREVIEW
    // ----------------------------------------

    if (
      selectedFile.type ===
        "application/pdf" ||
      extension === "pdf"
    ) {
      try {
        const arrayBuffer =
          await selectedFile.arrayBuffer();

        const pdf =
          await pdfjsLib.getDocument({
            data: arrayBuffer,
          }).promise;

        setTotalPages(
          pdf.numPages
        );

        const page =
          await pdf.getPage(1);

        const viewport =
          page.getViewport({
            scale: 1,
          });

        const canvas =
          document.createElement(
            "canvas"
          );

        const context =
          canvas.getContext("2d");

        canvas.width =
          viewport.width;

        canvas.height =
          viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        setPreviewUrl(
          canvas.toDataURL(
            "image/png"
          )
        );
      } catch (error) {
        console.error(
          "PDF preview error:",
          error
        );

        setMessage(
          "Unable to preview this PDF."
        );
      }
    } else {
      // Image preview
      const url =
        URL.createObjectURL(
          selectedFile
        );

      setPreviewUrl(url);
      setTotalPages(1);
    }
  };

  // ========================================
  // RENDER PDF PREVIEW
  // ========================================

  useEffect(() => {
    let cancelled = false;

    const renderPdfPage =
      async () => {
        if (
          !file ||
          previewPage < 1
        ) {
          return;
        }

        const extension =
          file.name
            .split(".")
            .pop()
            .toLowerCase();

        if (extension !== "pdf") {
          return;
        }

        try {
          const arrayBuffer =
            await file.arrayBuffer();

          const pdf =
            await pdfjsLib.getDocument({
              data: arrayBuffer,
            }).promise;

          if (
            previewPage >
            pdf.numPages
          ) {
            return;
          }

          const page =
            await pdf.getPage(
              previewPage
            );

          const viewport =
            page.getViewport({
              scale: 1,
            });

          const canvas =
            previewCanvasRef.current;

          if (!canvas) {
            return;
          }

          const context =
            canvas.getContext("2d");

          canvas.width =
            viewport.width;

          canvas.height =
            viewport.height;

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          if (!cancelled) {
            setPreviewUrl(
              canvas.toDataURL(
                "image/png"
              )
            );
          }
        } catch (error) {
          if (!cancelled) {
            console.error(
              "PDF page render error:",
              error
            );
          }
        }
      };

    renderPdfPage();

    return () => {
      cancelled = true;
    };
  }, [file, previewPage]);

  // ========================================
  // REMOVE FILE
  // ========================================

  const removeFile = () => {
    setFile(null);
    setMessage("");

    setPreviewUrl(null);
    setPreviewPage(1);
    setTotalPages(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ========================================
  // FORMAT FILE SIZE
  // ========================================

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  // ========================================
  // VALIDATE PAGE RANGE
  // ========================================

  const isValidPageRange = (
    range
  ) => {
    if (!range.trim()) {
      return false;
    }

    const parts =
      range
        .split(",")
        .map((part) =>
          part.trim()
        );

    if (parts.length === 0) {
      return false;
    }

    for (const part of parts) {
      // Single page: 5
      if (/^\d+$/.test(part)) {
        if (
          Number(part) < 1
        ) {
          return false;
        }

        continue;
      }

      // Range: 1-5
      if (
        /^\d+-\d+$/.test(part)
      ) {
        const [
          start,
          end,
        ] = part
          .split("-")
          .map(Number);

        if (
          start < 1 ||
          end < 1 ||
          start > end
        ) {
          return false;
        }

        continue;
      }

      return false;
    }

    return true;
  };

  // ========================================
  // PRINT REQUEST
  // ========================================

  const handlePrint = async (e) => {
    e.preventDefault();

    // ----------------------------------------
    // CHECK FILE
    // ----------------------------------------

    if (!file) {
      setMessage(
        "Please select a file first."
      );

      return;
    }

    // ----------------------------------------
    // CHECK PAGE RANGE
    // ----------------------------------------

    if (
      moreOptions &&
      pageSelection === "range"
    ) {
      if (
        !isValidPageRange(
          pageRange
        )
      ) {
        setMessage(
          "Enter a valid page range such as 1-3, 1,3,5-7."
        );

        return;
      }
    }

    // ----------------------------------------
    // CHECK PRINTER STATUS
    // ----------------------------------------

    if (!agentOnline) {
      setMessage(
        "Printer is offline. Please try again later."
      );

      return;
    }

    // ----------------------------------------
    // START LOADING
    // ----------------------------------------

    setLoading(true);
    setMessage("");
    setJobId(null);

    setCancelRequested(false);
    cancelRequestedRef.current =
      false;

    try {
      // --------------------------------------
      // RE-CHECK PRINTER STATUS
      // --------------------------------------

      const statusResponse =
        await fetch(
          `${API_URL}/api/agent/status`
        );

      const statusData =
        await statusResponse.json();

      if (!statusData.online) {
        throw new Error(
          "Printer is offline. Please try again later."
        );
      }

      setAgentOnline(true);

      // --------------------------------------
      // CREATE FORM DATA
      // --------------------------------------

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "printType",
        printType
      );

      formData.append(
        "copies",
        copies
      );

      // --------------------------------------
      // ADVANCED OPTIONS
      // --------------------------------------

      if (moreOptions) {
        formData.append(
          "orientation",
          orientation
        );

        formData.append(
          "paperSize",
          paperSize
        );

        formData.append(
          "fit",
          fit
        );

        formData.append(
          "pageMargins",
          pageMargins
        );

        formData.append(
          "pageSelection",
          pageSelection
        );

        formData.append(
          "pageRange",
          pageSelection ===
            "range"
            ? pageRange
            : ""
        );
      }

      // --------------------------------------
      // SEND REQUEST
      // --------------------------------------

      const response =
        await fetch(
          `${API_URL}/api/print`,
          {
            method: "POST",
            body: formData,
          }
        );

      // --------------------------------------
      // READ RESPONSE
      // --------------------------------------

      const data =
        await response.json();

      console.log(
        "Print response:",
        data
      );

      // --------------------------------------
      // CHECK RESPONSE
      // --------------------------------------

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Print request failed."
        );
      }

      // --------------------------------------
      // SAVE JOB ID
      // --------------------------------------

      setJobId(data.jobId);

      console.log(
        "Print Job Created:",
        data.jobId
      );

      // --------------------------------------
      // CANCEL WAS CLICKED WHILE
      // UPLOAD WAS PROCESSING
      // --------------------------------------

      if (
        cancelRequestedRef.current
      ) {
        try {
          setCancelling(true);

          setMessage(
            "Cancelling print job..."
          );

          const cancelResponse =
            await fetch(
              `${API_URL}/api/print/${data.jobId}/cancel`,
              {
                method: "PATCH",
              }
            );

          const cancelData =
            await cancelResponse.json();

          if (
            cancelResponse.ok
          ) {
            setMessage(
              "Print job cancelled successfully."
            );

            setJobId(null);
          } else {
            setMessage(
              cancelData.message ||
                "This print job can no longer be cancelled."
            );
          }
        } finally {
          setCancelling(false);

          setCancelRequested(
            false
          );

          cancelRequestedRef.current =
            false;
        }

        return;
      }

      // --------------------------------------
      // SUCCESS
      // --------------------------------------

      setMessage("success");

      setAgentOnline(true);

      // --------------------------------------
      // RESET FORM
      // --------------------------------------

      setFile(null);
      setCopies(1);
      setJobId(null);

      setMoreOptions(false);

      setOrientation("portrait");
      setPaperSize("A4");
      setFit("shrink-to-fit");
      setPageMargins("uniform");
      setPageSelection("all");
      setPageRange("");

      setPreviewUrl(null);
      setPreviewPage(1);
      setTotalPages(0);

      // --------------------------------------
      // CLEAR FILE INPUT
      // --------------------------------------

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }
    } catch (error) {
      console.error(
        "Print request error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to send print request."
      );
    } finally {
      setLoading(false);
      setCancelling(false);
    }
  };

  // ========================================
  // CANCEL PRINT JOB
  // ========================================

  const handleCancel = async () => {
    // ----------------------------------------
    // UPLOAD REQUEST STILL RUNNING
    // ----------------------------------------

    if (
      loading &&
      !jobId
    ) {
      cancelRequestedRef.current =
        true;

      setCancelRequested(true);

      setMessage(
        "Cancelling request..."
      );

      return;
    }

    // ----------------------------------------
    // NO JOB TO CANCEL
    // ----------------------------------------

    if (
      !jobId ||
      cancelling
    ) {
      return;
    }

    try {
      setCancelling(true);

      setMessage(
        "Cancelling print job..."
      );

      const response =
        await fetch(
          `${API_URL}/api/print/${jobId}/cancel`,
          {
            method: "PATCH",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "This print job can no longer be cancelled."
        );

        return;
      }

      setMessage(
        "Print job cancelled successfully."
      );

      setJobId(null);

      setCancelRequested(false);

      cancelRequestedRef.current =
        false;

      setLoading(false);
    } catch (error) {
      console.error(
        "Cancel print error:",
        error
      );

      setMessage(
        "Failed to cancel the print job."
      );
    } finally {
      setCancelling(false);
    }
  };

  // ========================================
  // PREVIOUS PREVIEW PAGE
  // ========================================

  const previousPreviewPage = () => {
    setPreviewPage((prev) =>
      Math.max(
        1,
        prev - 1
      )
    );
  };

  // ========================================
  // NEXT PREVIEW PAGE
  // ========================================

  const nextPreviewPage = () => {
    setPreviewPage((prev) =>
      Math.min(
        totalPages,
        prev + 1
      )
    );
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <form
      className="print-form"
      onSubmit={handlePrint}
    >
      {/* ==================================
          UPLOAD DOCUMENT
      =================================== */}

      <div className="form-section">
        <div className="section-title">
          <div>
            <h2>
              Upload your document
            </h2>

            <p>
              Select a PDF or image to print
            </p>
          </div>
        </div>

        {!file ? (
          <label
            htmlFor="fileInput"
            className="upload-area"
          >
            <div className="upload-icon">
              ↑
            </div>

            <div className="upload-text">
              <strong>
                Choose a file
              </strong>

              <span>
                or drag and drop here
              </span>
            </div>

            <small>
              PDF, JPG, JPEG, PNG • Max 20 MB
            </small>

            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>
        ) : (
          <div className="file-selected">
            <div className="file-info">
              <div className="file-icon">
                📄
              </div>

              <div className="file-details">
                <strong>
                  {file.name}
                </strong>

                <span>
                  {formatFileSize(
                    file.size
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="remove-file"
              onClick={removeFile}
              aria-label="Remove file"
              disabled={loading}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* ==================================
          PRINT TYPE
      =================================== */}

      <div className="form-section">
        <div className="section-title">
          <div>
            <h2>
              Print type
            </h2>

            <p>
              Choose how you want your document printed
            </p>
          </div>
        </div>

        <div className="print-options">
          {/* BLACK & WHITE */}

          <label
            className={`print-option ${
              printType ===
              "black-white"
                ? "selected"
                : ""
            }`}
          >
            <input
              type="radio"
              name="printType"
              value="black-white"
              checked={
                printType ===
                "black-white"
              }
              onChange={(e) =>
                setPrintType(
                  e.target.value
                )
              }
              disabled={
                !agentOnline ||
                loading
              }
            />

            <div className="option-content">
              <div className="option-icon bw-icon">
                ●
              </div>

              <div>
                <strong>
                  Black & White
                </strong>

                <span>
                  Standard monochrome printing
                </span>
              </div>
            </div>

            <div className="radio-check">
              ✓
            </div>
          </label>

          {/* COLOR */}

          <label
            className={`print-option ${
              printType === "color"
                ? "selected"
                : ""
            }`}
          >
            <input
              type="radio"
              name="printType"
              value="color"
              checked={
                printType === "color"
              }
              onChange={(e) =>
                setPrintType(
                  e.target.value
                )
              }
              disabled={
                !agentOnline ||
                loading
              }
            />

            <div className="option-content">
              <div className="option-icon color-icon">
                🌈
              </div>

              <div>
                <strong>
                  Color
                </strong>

                <span>
                  Full color printing
                </span>
              </div>
            </div>

            <div className="radio-check">
              ✓
            </div>
          </label>
        </div>
      </div>

      {/* ==================================
          NUMBER OF COPIES
      =================================== */}

      <div className="form-section">
        <div className="section-title">
          <div>
            <h2>
              Number of copies
            </h2>

            <p>
              Select how many copies you need
            </p>
          </div>
        </div>

        <div className="copies-row">
          <div className="copies-control">
            <button
              type="button"
              onClick={() =>
                setCopies(
                  (prev) =>
                    Math.max(
                      1,
                      prev - 1
                    )
                )
              }
              aria-label="Decrease copies"
              disabled={
                !agentOnline ||
                loading
              }
            >
              −
            </button>

            <span>
              {copies}
            </span>

            <button
              type="button"
              onClick={() =>
                setCopies(
                  (prev) =>
                    Math.min(
                      100,
                      prev + 1
                    )
                )
              }
              aria-label="Increase copies"
              disabled={
                !agentOnline ||
                loading
              }
            >
              +
            </button>
          </div>

          <span className="copies-limit">
            Maximum 100 copies
          </span>
        </div>
      </div>

      {/* ==================================
          MORE OPTIONS
      =================================== */}

      <div className="form-section">
        <button
          type="button"
          className="more-options-button"
          onClick={() =>
            setMoreOptions(
              (prev) => !prev
            )
          }
          disabled={loading}
        >
          <span>
            {moreOptions
              ? "⌃"
              : "⌄"}
          </span>

          <strong>
            More Options
          </strong>
        </button>

        {moreOptions && (
          <div className="advanced-options">
            {/* ORIENTATION */}

            <div className="advanced-option">
              <label>
                Orientation
              </label>

              <select
                value={orientation}
                onChange={(e) =>
                  setOrientation(
                    e.target.value
                  )
                }
                disabled={loading}
              >
                <option value="portrait">
                  Portrait
                </option>

                <option value="landscape">
                  Landscape
                </option>
              </select>
            </div>

            {/* PAPER SIZE */}

            <div className="advanced-option">
              <label>
                Paper Size
              </label>

              <select
                value={paperSize}
                onChange={(e) =>
                  setPaperSize(
                    e.target.value
                  )
                }
                disabled={loading}
              >
                <option value="A4">
                  A4
                </option>

                <option value="Letter">
                  Letter
                </option>

                <option value="Legal">
                  Legal
                </option>
              </select>
            </div>

            {/* FIT */}

            <div className="advanced-option">
              <label>
                Fit
              </label>

              <select
                value={fit}
                onChange={(e) =>
                  setFit(
                    e.target.value
                  )
                }
                disabled={loading}
              >
                <option value="shrink-to-fit">
                  Shrink to Fit
                </option>

                <option value="fit-to-page">
                  Fit to Page
                </option>

                <option value="actual-size">
                  Actual Size
                </option>
              </select>
            </div>

            {/* PAGE MARGINS */}

            <div className="advanced-option">
              <label>
                Page Margins
              </label>

              <select
                value={pageMargins}
                onChange={(e) =>
                  setPageMargins(
                    e.target.value
                  )
                }
                disabled={loading}
              >
                <option value="uniform">
                  Uniform
                </option>

                <option value="none">
                  None
                </option>

                <option value="minimum">
                  Minimum
                </option>
              </select>
            </div>

            {/* PAGE SELECTION */}

            <div className="advanced-option">
              <label>
                Page Selection
              </label>

              <select
                value={pageSelection}
                onChange={(e) => {
                  setPageSelection(
                    e.target.value
                  );

                  if (
                    e.target.value ===
                    "all"
                  ) {
                    setPageRange("");
                  }
                }}
                disabled={loading}
              >
                <option value="all">
                  All pages
                </option>

                <option value="range">
                  Range
                </option>
              </select>
            </div>

            {/* PAGE RANGE */}

            {pageSelection ===
              "range" && (
              <div className="advanced-option page-range-option">
                <label>
                  Page Range
                </label>

                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) =>
                    setPageRange(
                      e.target.value
                    )
                  }
                  placeholder="1-3, 5, 7-9"
                  disabled={loading}
                />

                <small>
                  Example: 1-3, 5, 7-9
                </small>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================
          PRINT PREVIEW
      =================================== */}

      {file && (
        <div className="form-section">
          <div className="section-title">
            <div>
              <h2>
                Print Preview
              </h2>

              <p>
                Preview your document before printing
              </p>
            </div>
          </div>

          <div className="print-preview">
            <div
  className={`preview-window preview-${paperSize.toLowerCase()} ${
    orientation === "landscape"
      ? "preview-landscape"
      : "preview-portrait"
  }`}
>
  <div
    className={`preview-page preview-fit-${fit} preview-margin-${pageMargins}`}
  >
    {previewUrl ? (
      <img
        src={previewUrl}
        alt={`Page ${previewPage} preview`}
        className="preview-image"
      />
    ) : (
      <div className="preview-placeholder">
        Loading preview...
      </div>
    )}
  </div>
</div>

            {file.name
              .toLowerCase()
              .endsWith(".pdf") &&
              totalPages > 1 && (
                <div className="preview-controls">
                  <button
                    type="button"
                    onClick={
                      previousPreviewPage
                    }
                    disabled={
                      previewPage <=
                        1 ||
                      loading
                    }
                  >
                    ← Previous
                  </button>

                  <span>
                    Page{" "}
                    {previewPage}{" "}
                    of{" "}
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={
                      nextPreviewPage
                    }
                    disabled={
                      previewPage >=
                        totalPages ||
                      loading
                    }
                  >
                    Next →
                  </button>
                </div>
              )}
          </div>

          <canvas
            ref={previewCanvasRef}
            style={{
              display: "none",
            }}
          />
        </div>
      )}

      {/* ==================================
          PRINT BUTTON
      =================================== */}

      <button
        type="submit"
        className="print-button"
        disabled={
          loading ||
          !file ||
          !agentOnline
        }
      >
        {loading ? (
          <>
            <span className="spinner"></span>

            {cancelRequested
              ? "Cancelling..."
              : "Sending request..."}
          </>
        ) : !agentOnline ? (
          <>Printer Offline</>
        ) : (
          <>
            🖨️ Send to Printer
          </>
        )}
      </button>

      {/* ==================================
          CANCEL BUTTON
      =================================== */}

      {(loading || jobId) && (
        <button
          type="button"
          className="cancel-button"
          onClick={handleCancel}
          disabled={
            cancelling ||
            cancelRequested
          }
        >
          {cancelling ||
          cancelRequested
            ? "Cancelling..."
            : "Cancel"}
        </button>
      )}

      {/* ==================================
          SUCCESS MESSAGE
      =================================== */}

      {message === "success" && (
        <div className="success-message">
          🔒 Print request created successfully.
        </div>
      )}

      {/* ==================================
          ERROR / STATUS MESSAGE
      =================================== */}

      {message !== "success" &&
        message !== "" && (
          <div className="error-message">
            ✕ {message}
          </div>
        )}
    </form>
  );
}

export default PrintForm;