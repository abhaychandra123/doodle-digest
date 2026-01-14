// Simple client-side service that calls backend AI endpoints

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const AI_BASE_URL = `${API_BASE_URL}/ai`;

async function postToBackend(endpoint: string, body: any, isFormData: boolean = false) {
    const headers: HeadersInit = {};

    let fetchBody: BodyInit;

    if (isFormData) {
        fetchBody = body;
    } else {
        headers['Content-Type'] = 'application/json';
        fetchBody = JSON.stringify(body);
    }
    
    const res = await fetch(`${AI_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: fetchBody,
        credentials: 'include',
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || 'An error occurred with the AI service.');
    }
    return res.json();
}

async function fetchJobStatus(jobId: string) {
    const res = await fetch(`${AI_BASE_URL}/jobs/${jobId}`, { credentials: 'include' });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || 'Failed to fetch processing status.');
    }
    return res.json();
}

async function fetchDocument(documentId: string) {
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, { credentials: 'include' });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || 'Failed to fetch processed document.');
    }
    return res.json();
}

export const processFileOnBackend = async (file: File, onProgress: (message: string) => void) => {
    onProgress('Uploading file to server...');
    const formData = new FormData();
    formData.append('file', file);
    const { jobId } = await postToBackend('/process-file', formData, true);

    const start = Date.now();
    while (true) {
        const job = await fetchJobStatus(jobId);
        if (job.progressMessage) {
            onProgress(job.progressMessage);
        }
        if (job.status === 'completed' && job.documentId) {
            return await fetchDocument(job.documentId);
        }
        if (job.status === 'failed') {
            throw new Error(job.error || 'Processing failed');
        }
        if (Date.now() - start > 10 * 60 * 1000) {
            throw new Error('Processing timed out. Please try again later.');
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
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
