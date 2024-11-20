import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, List, ListItem } from '@chakra-ui/react';

const GoogleIntegration = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [gmailMessages, setGmailMessages] = useState([]);

  useEffect(() => {
    // Check if the user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/v1/auth/google/status');
        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuth();
  }, []);

  const handleAuth = () => {
    window.location.href = '/api/v1/auth/google';
  };

  const fetchDriveFiles = async () => {
    try {
      const response = await fetch('/api/v1/google/drive/files');
      const data = await response.json();
      setDriveFiles(data.files);
    } catch (error) {
      console.error('Error fetching Drive files:', error);
    }
  };

  const fetchGmailMessages = async () => {
    try {
      const response = await fetch('/api/v1/google/gmail/messages');
      const data = await response.json();
      setGmailMessages(data.messages);
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Google Integration</h2>
      {!isAuthenticated ? (
        <Button onClick={handleAuth}>Authenticate with Google</Button>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Google Drive Files</h3>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchDriveFiles} className="mb-2">Fetch Drive Files</Button>
              <List>
                {driveFiles.map((file) => (
                  <ListItem key={file.id}>
                    <Badge primary={file.name} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Gmail Messages</h3>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchGmailMessages} className="mb-2">Fetch Gmail Messages</Button>
              <List>
                {gmailMessages.map((message) => (
                  <ListItem key={message.id}>
                    <ListItemText primary={message.snippet} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GoogleIntegration;