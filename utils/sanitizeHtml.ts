import DOMPurify from 'dompurify';

export const sanitizeHtml = (dirty: string) => DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } });
