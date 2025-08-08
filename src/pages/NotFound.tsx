import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="page-container">
      <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h1 className="text-3xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray mb-4">Oops! Page not found</p>
          <a href="/" className="btn btn-primary">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
