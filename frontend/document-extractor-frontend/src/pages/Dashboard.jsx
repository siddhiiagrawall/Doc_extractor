import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Activity,
  Users,
  Download
} from 'lucide-react';
import { documentAPI } from '../lib/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    processedDocuments: 0,
    pendingDocuments: 0,
    recentDocuments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await documentAPI.getDocuments();
      const documents = response.data.documents || [];
      
      const processed = documents.filter(doc => doc.processed);
      const pending = documents.filter(doc => !doc.processed);
      
      setStats({
        totalDocuments: documents.length,
        processedDocuments: processed.length,
        pendingDocuments: pending.length,
        recentDocuments: documents.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Mock data for development
      setStats({
        totalDocuments: 12,
        processedDocuments: 10,
        pendingDocuments: 2,
        recentDocuments: [
          {
            id: 1,
            title: 'Invoice_2024_001.pdf',
            document_type: 'invoice',
            uploaded_at: '2024-01-15T10:30:00Z',
            processed: true
          },
          {
            id: 2,
            title: 'Resume_John_Doe.pdf',
            document_type: 'resume',
            uploaded_at: '2024-01-14T15:45:00Z',
            processed: true
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-primary-foreground/90">
          Manage your document extractions and view analytics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processedDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDocuments > 0 ? Math.round((stats.processedDocuments / stats.totalDocuments) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/upload">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Upload className="h-6 w-6" />
                <span>Upload Document</span>
              </Button>
            </Link>
            
            <Link to="/documents">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <FileText className="h-6 w-6" />
                <span>View Documents</span>
              </Button>
            </Link>
            
            <Link to="/history">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Activity className="h-6 w-6" />
                <span>View History</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>
            Your latest document extractions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentDocuments.length > 0 ? (
            <div className="space-y-4">
              {stats.recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{doc.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {formatDate(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getDocumentTypeColor(doc.document_type)}>
                      {doc.document_type.replace('_', ' ')}
                    </Badge>
                    {doc.processed ? (
                      <Badge variant="success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Processed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              <div className="text-center pt-4">
                <Link to="/documents">
                  <Button variant="outline">View All Documents</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first document to get started
              </p>
              <Link to="/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

