// Simple client-side service that calls backend AI endpoints

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api') + '/ai';

async function postToBackend(endpoint: string, body: any, isFormData: boolean = false) {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'x-auth-token': token || '',
    };

    let fetchBody: BodyInit;

    if (isFormData) {
        fetchBody = body;
    } else {
        headers['Content-Type'] = 'application/json';
        fetchBody = JSON.stringify(body);
    }
    
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: fetchBody,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || 'An error occurred with the AI service.');
    }
    return res.json();
}

export const processFileOnBackend = async (file: File, onProgress: (message: string) => void) => {
    onProgress('Uploading file to server...');
    const formData = new FormData();
    formData.append('file', file);
    const savedDocument = await postToBackend('/process-file', formData, true);
    return savedDocument;
};

export const generateCreatorStory = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const data = await postToBackend('/storyfy', formData, true);
    return data.story;
};

export const suggestImprovements = async (text: string): Promise<string> => {
    const data = await postToBackend('/suggest', { text });
    return data.suggestion;
};

export const generateScribble = async (doodleDescription: string): Promise<string | null> => {
    try {
        const data = await postToBackend('/generate-scribble', { description: doodleDescription });
        return data.doodleUrl;
    } catch (error) {
        console.error('Failed to generate scribble:', error);
        return null;
    }
};

