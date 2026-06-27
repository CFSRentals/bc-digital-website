import logo from "../assets/logo.png";
import { ArrowRight, Menu } from "lucide-react";

export default function Navbar() {
  return (
    <header className="navbar">
      <a className="brand" href="#home" aria-label="BC Digital home">
        <img src={logo} alt="BC Digital" className="brandLogo" />

        <div className="brandText">
          <strong>BC Digital</strong>
          <span>Business Software</span>
        </div>
      </a>

      <nav className="navLinks">
        <a href="#products">Products</a>
        <a href="#industries">Industries</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
      </nav>

      <div className="navActions">
        <a className="loginLink" href="https://app.bcdigital.org">
          Log In
        </a>

        <a className="trialButton" href="https://app.bcdigital.org">
          Start Free Trial <ArrowRight size={16} />
        </a>
      </div>

      <button className="mobileMenu" aria-label="Open menu">
        <Menu size={22} />
      </button>
    </header>
  );
}