import { useRef, useState } from "react";

function PrintForm() {
  const [file, setFile] = useState(null);
  const [printType, setPrintType] = useState("black-white");
  const [copies, setCopies] = useState(1);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Reference to file input
  const fileInputRef = useRef(null);


  // ========================================
  // FILE SELECTION
  // ========================================

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) {
      return;
    }


    // 20 MB file size limit

    if (selectedFile.size > 20 * 1024 * 1024) {

      setMessage(
        "File size must be less than 20 MB."
      );

      // Clear selected file

      e.target.value = "";

      return;
    }


    setFile(selectedFile);

    setMessage("");
  };


  // ========================================
  // REMOVE FILE
  // ========================================

  const removeFile = () => {

    setFile(null);

    setMessage("");


    // Safely clear file input

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


    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }


    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };


  // ========================================
  // PRINT REQUEST
  // ========================================

  const handlePrint = async (e) => {

    e.preventDefault();


    // ----------------------------------------
    // Check file
    // ----------------------------------------

    if (!file) {

      setMessage(
        "Please select a file first."
      );

      return;
    }


    // ----------------------------------------
    // Start loading
    // ----------------------------------------

    setLoading(true);

    setMessage("");


    try {

      // --------------------------------------
      // Create FormData
      // --------------------------------------

      const formData = new FormData();

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
      // Send request to backend
      // --------------------------------------

      const response = await fetch(
        "http://localhost:5000/api/print",
        {
          method: "POST",
          body: formData
        }
      );


      // --------------------------------------
      // Read response
      // --------------------------------------

      const data =
        await response.json();


      console.log(
        "Print response:",
        data
      );


      // --------------------------------------
      // Check response
      // --------------------------------------

      if (!response.ok) {

        throw new Error(
          data.message ||
          "Print request failed."
        );

      }


      // --------------------------------------
      // Success
      // --------------------------------------

      setMessage("success");


      // Reset form state

      setFile(null);

      setCopies(1);


      // Safely clear file input

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }


      console.log(
        "Print Job Created:",
        data.job
      );

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

    }
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
                  {formatFileSize(file.size)}
                </span>

              </div>

            </div>


            <button
              type="button"
              className="remove-file"
              onClick={removeFile}
              aria-label="Remove file"
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
              printType === "black-white"
                ? "selected"
                : ""
            }`}
          >

            <input
              type="radio"
              name="printType"
              value="black-white"
              checked={
                printType === "black-white"
              }
              onChange={(e) =>
                setPrintType(
                  e.target.value
                )
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
                setCopies((prev) =>
                  Math.max(
                    1,
                    prev - 1
                  )
                )
              }
              aria-label="Decrease copies"
            >
              −
            </button>


            <span>
              {copies}
            </span>


            <button
              type="button"
              onClick={() =>
                setCopies((prev) =>
                  Math.min(
                    100,
                    prev + 1
                  )
                )
              }
              aria-label="Increase copies"
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
          PRINT BUTTON
      =================================== */}

      <button
        type="submit"
        className="print-button"
        disabled={
          loading ||
          !file
        }
      >

        {loading ? (

          <>
            <span className="spinner"></span>

            Sending request...
          </>

        ) : (

          <>
            🖨️

            Send to Printer
          </>

        )}

      </button>


      {/* ==================================
          SUCCESS MESSAGE
      =================================== */}

      {message === "success" && (

        <div className="success-message">

          ✓ Print request sent successfully!

        </div>

      )}


      {/* ==================================
          ERROR MESSAGE
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