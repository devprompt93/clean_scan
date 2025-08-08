import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Mock authentication
    try {
      const response = await fetch('/mockData/users.json');
      const users = await response.json();
      const user = users.find(u => u.username === credentials.username && u.password === credentials.password);
      
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.role === 'provider') {
          navigate('/provider');
        } else if (user.role === 'admin') {
          navigate('/admin');
        }
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="container" style={{ maxWidth: '400px', paddingTop: '80px' }}>
        <div className="card">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-primary mb-2">CityCleanTracker</h1>
            <p className="text-gray">Smart toilet cleaning management system</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className={`btn btn-primary btn-lg ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? <span className="spinner"></span> : null}
              Sign In
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray">Demo accounts:</p>
            <p className="text-sm">Provider: provider1 / password123</p>
            <p className="text-sm">Admin: admin / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;