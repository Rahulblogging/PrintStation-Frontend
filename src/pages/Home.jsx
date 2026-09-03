import Navbar from "../components/Navbar";
import PrintForm from "../components/PrintForm";

function Home() {
  return (
    <div className="app">

      <Navbar />

      <main className="home-container">

        <div className="hero">

          <div className="hero-badge">
            <span></span>
            Ready to print
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