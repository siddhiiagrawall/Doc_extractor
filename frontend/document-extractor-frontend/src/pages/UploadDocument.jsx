import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react';
import { documentAPI } from '../lib/api';

const UploadDocument = () => {
  const [formData, setFormData] = useState({
    title: '',
    document_type: '',
    custom_prompt: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  const navigate = useNavigate();

  const documentTypes = [
    { value: 'invoice', label: 'Invoice' },
    { value: 'resume', label: 'Resume' },
    { value: 'research_paper', label: 'Research Paper' },
    { value: 'other', label: 'Other (Custom)' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileSelect = (file) => {
    if (file && file.type === 'application/pdf') {
      setFormData({
        ...formData,
        file: file,
        title: formData.title || file.name
      });
      setError('');
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!formData.document_type) {
      setError('Please select a document type');
      return;
    }
    
    if (formData.document_type === 'other' && !formData.custom_prompt) {
      setError('Please provide a custom prompt for other document types');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', formData.file);
      formDataToSend.append('document_type', formData.document_type);
      formDataToSend.append('title', formData.title);
      
      if (formData.document_type === 'other') {
        formDataToSend.append('custom_prompt', formData.custom_prompt);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await documentAPI.extractDocument(formDataToSend);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response.data.success) {
        setResult(response.data);
        // Reset form
        setFormData({
          title: '',
          document_type: '',
          custom_prompt: '',
          file: null
        });
      } else {
        setError(response.data.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during upload');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const removeFile = () => {
    setFormData({
      ...formData,
      file: null
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
        <p className="text-gray-600 mt-1">
          Upload a PDF document to extract structured data using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>
              Select a PDF file and configure extraction settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>PDF File</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {formData.file ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{formData.file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Drop your PDF here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Maximum file size: 10MB
                      </p>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label htmlFor="file-upload">
                        <Button type="button" variant="outline" asChild>
                          <span>Select File</span>
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter document title (optional)"
                />
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Prompt (for 'other' type) */}
              {formData.document_type && (
                <div className="space-y-2">
                  <Label htmlFor="custom_prompt">Extraction Prompt</Label>
                  <Textarea
                    id="custom_prompt"
                    name="custom_prompt"
                    value={formData.custom_prompt}
                    onChange={handleInputChange}
                    placeholder="Describe what information you want to extract from this document..."
                    rows={4}
                  />
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading and processing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={uploading || !formData.file || !formData.document_type}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Extract
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Extraction Results</CardTitle>
            <CardDescription>
              AI-extracted data will appear here after processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Extraction Completed</span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Document Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Type:</strong> {result.document_type}</p>
                    <p><strong>Processing Time:</strong> {result.processing_time?.toFixed(2)}s</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Extracted Data</h4>
                  <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-64">
                    {JSON.stringify(result.extracted_data, null, 2)}
                  </pre>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => navigate('/documents')}
                    variant="outline"
                  >
                    View All Documents
                  </Button>
                  <Button
                    onClick={() => navigate(`/documents/${result.document_id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Upload a document to see extraction results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadDocument;

