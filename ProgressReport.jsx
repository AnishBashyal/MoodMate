import React from 'react';
import { Brain } from 'lucide-react';

const ProgressReport = ({ report }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-8 h-8 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-800">Progress Report</h2>
      </div>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-700 whitespace-pre-line">{report}</p>
      </div>
    </div>
  );
};

export default ProgressReport;