import type { Prompt } from '../types';

// ###################################################################################
// #                                                                                 #
// #   !!! IMPORTANT DEVELOPER NOTICE !!!                                            #
// #                                                                                 #
// #   To enable the "Save to Google Drive" feature, you MUST replace the            #
// #   placeholder value below with your actual Google Cloud Client ID.              #
// #                                                                                 #
// #   1. Go to the Google Cloud Console: https://console.cloud.google.com/          #
// #   2. Create a new project or select an existing one.                            #
// #   3. Go to "APIs & Services" > "Credentials".                                   #
// #   4. Create an "OAuth 2.0 Client ID".                                           #
// #   5. Select "Web application" as the application type.                          #
// #   6. Add the authorized JavaScript origins (the URL where your app is hosted).  #
// #   7. Copy the generated Client ID and paste it below.                           #
// #                                                                                 #
// ###################################################################################
const CLIENT_ID = 'YOUR_GOOGLE_CLOUD_CLIENT_ID.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export const isDriveConfigured = !CLIENT_ID.startsWith('YOUR_GOOGLE_CLOUD_CLIENT_ID');

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export const loadGapiScript = () => new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => resolve();
    document.body.appendChild(script);
});

export const loadGisScript = () => new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    document.body.appendChild(script);
});


export const gapiInit = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        window.gapi.load('client', async () => {
            try {
                await window.gapi.client.init({
                    // No API key needed for this flow
                    // apiKey: API_KEY, 
                    clientId: CLIENT_ID,
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                });
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
};

export const createTokenClient = (callback: (tokenResponse: any) => void) => {
    if (!isDriveConfigured) {
        console.warn("Google Drive service is not configured. Please provide a Client ID.");
        return null;
    }
    return window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: callback,
    });
};

export const requestAccessToken = (tokenClient: any) => {
    tokenClient.requestAccessToken();
};

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const res = await fetch(dataUrl);
    return res.blob();
}

export const uploadImageAndPrompt = async (imageDataUrl: string, prompt: Prompt, fileNameSuffix?: string) => {
    if (!isDriveConfigured) {
        throw new Error("Google Drive feature is not configured. Please provide a Client ID in the code.");
    }

    const imageBlob = await dataUrlToBlob(imageDataUrl);
    const safeSuffix = fileNameSuffix ? `_${fileNameSuffix}` : '';
    
    const metadata = {
        name: `nano-banana-edit${safeSuffix}.png`,
        mimeType: imageBlob.type,
    };
    const promptMetadata = {
        name: `nano-banana-prompt${safeSuffix}.json`,
        mimeType: 'application/json',
    };
    
    const promptBlob = new Blob([JSON.stringify(prompt, null, 2)], {type: 'application/json'});

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', imageBlob);
    
    const formPrompt = new FormData();
    formPrompt.append('metadata', new Blob([JSON.stringify(promptMetadata)], { type: 'application/json' }));
    formPrompt.append('file', promptBlob);

    // First upload the image
    const imageResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': `Bearer ${window.gapi.client.getToken().access_token}` }),
        body: form,
    });

    if (!imageResponse.ok) {
        const error = await imageResponse.json();
        throw new Error(`Failed to upload image: ${error.error.message}`);
    }
    
    // Then upload the prompt
    const promptResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': `Bearer ${window.gapi.client.getToken().access_token}` }),
        body: formPrompt,
    });

    if (!promptResponse.ok) {
        const error = await promptResponse.json();
        throw new Error(`Failed to upload prompt: ${error.error.message}`);
    }
};