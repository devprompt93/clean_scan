import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import * as XLSX from 'xlsx';

const ReportsPage = () => {
  const [user, setUser] = useState(null);
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id || currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    // Load data for reports
    Promise.all([
      fetch('/mockData/toilets.json').then(res => res.json()),
      fetch('/mockData/cleanings.json').then(res => res.json()),
      fetch('/mockData/users.json').then(res => res.json())
    ]).then(([toilets, cleanings, users]) => {
      setReportData({ toilets, cleanings, users });
      setLoading(false);
    }).catch(error => {
      console.error('Error loading data:', error);
      setLoading(false);
    });
  }, [navigate]);

  const generateExcelReport = async () => {
    setGenerating(true);
    try {
      const { toilets, cleanings, users } = reportData;
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['CityCleanTracker Report'],
        ['Generated:', new Date().toLocaleString()],
        [''],
        ['Summary Statistics'],
        ['Total Toilets:', toilets.length],
        ['Total Cleanings:', cleanings.length],
        ['Active Providers:', users.filter(u => u.role === 'provider').length],
        ['Completed Cleanings:', cleanings.filter(c => c.status === 'completed').length],
        ['Flagged Cleanings:', cleanings.filter(c => c.flagged).length],
        ['Average AI Score:', cleanings.filter(c => c.aiScore).reduce((sum, c) => sum + c.aiScore, 0) / cleanings.filter(c => c.aiScore).length || 0]
      ];
      
      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
      
      // Toilets sheet
      const toiletData = toilets.map(toilet => ({
        'Toilet ID': toilet.id,
        'Name': toilet.name,
        'Area': toilet.area,
        'Status': toilet.status,
        'Tracker Installed': toilet.trackerInstalled ? 'Yes' : 'No',
        'Last Cleaned': toilet.lastCleaned,
        'GPS Latitude': toilet.gpsCoords[0],
        'GPS Longitude': toilet.gpsCoords[1],
        'Description': toilet.description
      }));
      
      const toiletWS = XLSX.utils.json_to_sheet(toiletData);
      XLSX.utils.book_append_sheet(wb, toiletWS, 'Toilets');
      
      // Cleanings sheet
      const cleaningData = cleanings.map(cleaning => ({
        'Cleaning ID': cleaning.id,
        'Toilet ID': cleaning.toiletId,
        'Provider ID': cleaning.providerId,
        'Timestamp': cleaning.timestamp,
        'Status': cleaning.status,
        'AI Score': cleaning.aiScore || 'N/A',
        'Flagged': cleaning.flagged ? 'Yes' : 'No',
        'GPS Latitude': cleaning.gps ? cleaning.gps[0] : 'N/A',
        'GPS Longitude': cleaning.gps ? cleaning.gps[1] : 'N/A',
        'Notes': cleaning.notes || ''
      }));
      
      const cleaningWS = XLSX.utils.json_to_sheet(cleaningData);
      XLSX.utils.book_append_sheet(wb, cleaningWS, 'Cleanings');
      
      // Save file
      XLSX.writeFile(wb, `CityCleanTracker_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error('Error generating Excel report:', error);
      alert('Failed to generate Excel report');
    } finally {
      setGenerating(false);
    }
  };

  const generatePDFReport = async () => {
    setGenerating(true);
    try {
      // Mock PDF generation - in real app would use jsPDF
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('PDF generation would be implemented here using jsPDF library');
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Failed to generate PDF report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <TopNav user={user} />
        <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
          <p className="mt-3">Loading report data...</p>
        </div>
      </div>
    );
  }

  const { toilets = [], cleanings = [], users = [] } = reportData;

  return (
    <div className="page-container">
      <TopNav user={user} />
      
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="card mb-4">
          <h1 className="text-2xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-gray">Generate comprehensive reports on toilet cleaning activities</p>
        </div>

        {/* Report Statistics */}
        <div className="grid grid-4 mb-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary">{toilets.length}</div>
            <div className="text-sm text-gray">Total Toilets</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl font-bold text-success">{cleanings.filter(c => c.status === 'completed').length}</div>
            <div className="text-sm text-gray">Completed Cleanings</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl font-bold text-warning">{cleanings.filter(c => c.flagged).length}</div>
            <div className="text-sm text-gray">Quality Flags</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary">{users.filter(u => u.role === 'provider').length}</div>
            <div className="text-sm text-gray">Active Providers</div>
          </div>
        </div>

        {/* Report Generation */}
        <div className="grid grid-2">
          <div className="card">
            <h2 className="card-title">📊 Excel Report</h2>
            <p className="text-gray mb-4">
              Generate a comprehensive Excel report with multiple sheets containing:
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
              <li>Summary statistics</li>
              <li>Complete toilet inventory</li>
              <li>Cleaning history with AI scores</li>
              <li>Provider performance data</li>
            </ul>
            
            <button 
              className={`btn btn-primary btn-lg ${generating ? 'loading' : ''}`}
              onClick={generateExcelReport}
              disabled={generating}
            >
              {generating ? <span className="spinner"></span> : '📥'}
              Download Excel Report
            </button>
          </div>

          <div className="card">
            <h2 className="card-title">📄 PDF Report</h2>
            <p className="text-gray mb-4">
              Generate a formatted PDF report with charts and visualizations:
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
              <li>Executive summary</li>
              <li>Performance charts</li>
              <li>Quality trends analysis</li>
              <li>Geographic distribution</li>
            </ul>
            
            <button 
              className={`btn btn-secondary btn-lg ${generating ? 'loading' : ''}`}
              onClick={generatePDFReport}
              disabled={generating}
            >
              {generating ? <span className="spinner"></span> : '📄'}
              Generate PDF Report
            </button>
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className="card mt-4">
          <h2 className="card-title">Recent Activity Summary</h2>
          
          <div className="grid grid-2">
            <div>
              <h3 className="font-semibold mb-2">Top Performing Areas</h3>
              {toilets
                .reduce((acc, toilet) => {
                  if (!acc[toilet.area]) acc[toilet.area] = 0;
                  acc[toilet.area] += cleanings.filter(c => c.toiletId === toilet.id && c.status === 'completed').length;
                  return acc;
                }, {})
                && Object.entries(toilets.reduce((acc, toilet) => {
                  if (!acc[toilet.area]) acc[toilet.area] = 0;
                  acc[toilet.area] += cleanings.filter(c => c.toiletId === toilet.id && c.status === 'completed').length;
                  return acc;
                }, {}))
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([area, count]) => (
                  <div key={area} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-xs) 0' }}>
                    <span>{area}</span>
                    <strong>{count} cleanings</strong>
                  </div>
                ))
              }
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Quality Metrics</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-xs) 0' }}>
                <span>Average AI Score</span>
                <strong>
                  {cleanings.filter(c => c.aiScore).length > 0 
                    ? (cleanings.filter(c => c.aiScore).reduce((sum, c) => sum + c.aiScore, 0) / cleanings.filter(c => c.aiScore).length).toFixed(1)
                    : 'N/A'
                  }/10
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-xs) 0' }}>
                <span>Quality Flag Rate</span>
                <strong>
                  {cleanings.length > 0 
                    ? Math.round((cleanings.filter(c => c.flagged).length / cleanings.length) * 100)
                    : 0
                  }%
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-xs) 0' }}>
                <span>Completion Rate</span>
                <strong>
                  {cleanings.length > 0 
                    ? Math.round((cleanings.filter(c => c.status === 'completed').length / cleanings.length) * 100)
                    : 0
                  }%
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center mt-4">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/admin')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;