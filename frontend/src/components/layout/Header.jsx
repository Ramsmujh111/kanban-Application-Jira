const Header = ({ title, subtitle, children }) => {
  return (
    <header className="main-header">
      <div className="header-left">
        <div>
          <h1 className="header-title">{title || 'TaskFlow'}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="header-right">
        {children}
      </div>
    </header>
  );
};

export default Header;
