import { Link, NavLink } from "react-router-dom";

function Header() {
  return (
    <header className="site-header">
      <p className="demo-banner">
        Demo with synthetic data. Every report and number on this site is made
        up.
      </p>
      <div className="site-header-inner">
        <Link to="/" className="site-title">
          B.C. Dangerous Goods Incident Reports
        </Link>
        <nav aria-label="Main">
          <NavLink to="/" end>
            Overview
          </NavLink>
          <NavLink to="/about">About the data</NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;
