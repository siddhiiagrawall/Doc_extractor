import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Clock, 
  CheckCircle, 
  Calendar,
  User,
  Database,
  Code,
  Copy,
  ExternalLink
} from 'lucide-react';
import { documentAPI } from '../lib/api';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocumentDetail();
  }, [id]);

  const fetchDocumentDetail = async () => {
    try {
      const response = await documentAPI.getDocumentDetail(id);
      setDocument(response.data.document);
    } catch (error) {
      console.error('Error fetching document detail:', error);
      // Mock data for development
      const mockDocument = {
        id: parseInt(id),
        title: 'Invoice_2024_001.pdf',
        document_type: 'invoice',
        custom_prompt: null,
        uploaded_at: '2024-01-15T10:30:00Z',
        processed: true,
        processing_time: 2.5,
        created_at: '2024-01-15T10:32:30Z',
        extracted_data: {
          invoice_number: 'INV-2024-001',
          date: '2024-01-15',
          vendor: 'ABC Corporation',
          vendor_address: '123 Business St, City, State 12345',
          amount: '$1,250.00',
          tax: '$125.00',
          total: '$1,375.00',
          items: [
            { description: 'Web Development Services', quantity: 1, rate: '$1,250.00' }
          ],
          payment_terms: 'Net 30',
          due_date: '2024-02-14'
        }
      };
      setDocument(mockDocument);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentTypeColor = (type) => {
    const colors = {
      invoice: 'bg-blue-100 text-blue-800',
      resume: 'bg-green-100 text-green-800',
      research_paper: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const exportData = (format) => {
    if (!document?.extracted_data) return;
    
    let content, filename, mimeType;
    
    if (format === 'json') {
      content = JSON.stringify(document.extracted_data, null, 2);
      filename = `${document.title}_extracted.json`;
      mimeType = 'application/json';
    } else if (format === 'csv') {
      // Simple CSV export for flat data
      const flatData = flattenObject(document.extracted_data);
      const headers = Object.keys(flatData).join(',');
      const values = Object.values(flatData).map(v => `"${v}"`).join(',');
      content = `${headers}\n${values}`;
      filename = `${document.title}_extracted.csv`;
      mimeType = 'text/csv';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const flattenObject = (obj, prefix = '') => {
    const flattened = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, flattenObject(obj[key], newKey));
        } else {
          flattened[newKey] = Array.isArray(obj[key]) ? JSON.stringify(obj[key]) : obj[key];
        }
      }
    }
    return flattened;
  };

  const renderExtractedData = (data, level = 0) => {
    if (!data) return null;

    return Object.entries(data).map(([key, value]) => (
      <div key={key} className={`${level > 0 ? 'ml-4' : ''} mb-3`}>
        <div className="flex items-center justify-between">
          <h4 className={`font-medium ${level === 0 ? 'text-base' : 'text-sm'} text-gray-700 capitalize`}>
            {key.replace(/_/g, ' ')}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(typeof value === 'object' ? JSON.stringify(value) : String(value))}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <div className={`${level === 0 ? 'bg-gray-50' : 'bg-gray-100'} rounded p-3 mt-1`}>
          {typeof value === 'object' && value !== null ? (
            Array.isArray(value) ? (
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              renderExtractedData(value, level + 1)
            )
          ) : (
            <p className="text-sm text-gray-600">{String(value)}</p>
          )}
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Document not found</h2>
        <p className="text-gray-600 mb-4">The document you're looking for doesn't exist.</p>
        <Link to="/documents">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/documents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <Badge className={getDocumentTypeColor(document.document_type)}>
                {document.document_type.replace('_', ' ')}
              </Badge>
              {document.processed ? (
                <Badge variant="success" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Processed
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {document.processed && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => exportData('json')}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" onClick={() => exportData('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Upload Date</h4>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm">{formatDate(document.uploaded_at)}</span>
                </div>
              </div>
              
              {document.processed && (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Processing Time</h4>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{document.processing_time}s</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Completed At</h4>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{formatDate(document.created_at)}</span>
                    </div>
                  </div>
                </>
              )}
              
              {document.custom_prompt && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Custom Prompt</h4>
                  <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                    {document.custom_prompt}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Extracted Data */}
        <div className="lg:col-span-2">
          {document.processed && document.extracted_data ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Extracted Data
                </CardTitle>
                <CardDescription>
                  AI-extracted information from your document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="structured" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="structured">Structured View</TabsTrigger>
                    <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="structured" className="mt-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {renderExtractedData(document.extracted_data)}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="raw" className="mt-4">
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => copyToClipboard(JSON.stringify(document.extracted_data, null, 2))}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96">
                        {JSON.stringify(document.extracted_data, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {document.processed ? 'No extracted data' : 'Processing in progress'}
                  </h3>
                  <p className="text-gray-500">
                    {document.processed 
                      ? 'This document was processed but no data was extracted.'
                      : 'Please wait while we extract data from your document.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link to="/upload">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Upload Another Document
              </Button>
            </Link>
            <Link to="/documents">
              <Button variant="outline">
                <Database className="h-4 w-4 mr-2" />
                View All Documents
              </Button>
            </Link>
            {document.processed && (
              <Button variant="outline" onClick={() => copyToClipboard(window.location.href)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Share Link
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentDetail;

