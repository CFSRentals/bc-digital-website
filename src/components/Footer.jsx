export default function Footer() {
  return (
    <footer className="footer">
      <div>
        <div className="footerBrand">
          <div className="brandMark">BC</div>
          <strong>BC Digital</strong>
        </div>
        <p>Business software built for real-world service companies.</p>
      </div>

      <div className="footerLinks">
        <a href="#products">Products</a>
        <a href="#industries">Industries</a>
        <a href="#pricing">Pricing</a>
        <a href="https://app.bcdigital.org">Start Trial</a>
      </div>

      <span>© {new Date().getFullYear()} BC Digital. All rights reserved.</span>
    </footer>
  );
}
