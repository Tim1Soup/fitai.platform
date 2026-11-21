import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = () => {
  const location = useLocation();

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        <div key={location.pathname} className="layout-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;