// filepath: e:\Users\PaulC\Source\repos\PaulCutcliffe\openai-realtime-agents\src\app\components\ReportViewer.tsx
import React, { useState, useEffect } from 'react';

interface ReportViewerProps {
  reportFileId: string | null;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ reportFileId }) => {
  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportFileId) {
      setData(null); // Clear data if no file ID
      return;
    }

    const fetchReportData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // This endpoint doesn't exist yet, we'll create it later
        const response = await fetch(`/api/gardners/getReportFileContent?fileId=${reportFileId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch report data: ${response.statusText}`);
        }
        const result = await response.json();
        setData(result.data);  // Assuming the API returns { data: [...] }
      } catch (err: any) {
        setError(err.message);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [reportFileId]);  // Re-run effect if reportFileId changes

  if (isLoading) return <p className="text-center p-4">Loading full report...</p>;
  if (error) return <p className="text-center p-4 text-red-500">Error loading report: {error}</p>;
  if (!data || data.length === 0) return <p className="text-center p-4">No data to display for this report.</p>;

  // Assuming data is an array of objects and all objects have the same keys
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="overflow-x-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Full Report Data</h2>
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-100">
          <tr>
            {headers.map(header => (
              <th 
                key={header} 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
              >
                {header.replace(/_/g, ' ')} {/* Replace underscores with spaces for readability */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {headers.map(header => (
                <td 
                  key={`${rowIndex}-${header}`} 
                  className="px-2 py-1 whitespace-nowrap text-xs text-gray-700" // Reduced padding and font size
                >
                  {String(row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportViewer;
