import ProcessingJob from '../models/ProcessingJob';
import DocumentModel from '../models/Document';
import Activity from '../models/Activity';
import { processPdf, processImage } from './fileProcessor';
import {
  generateDoodleSummary,
  generateNotebookSummary,
  generateTotalSummary,
  generateMiniExercise,
} from './llmService';
import { getObjectBuffer } from './storageService';

const updateProgress = async (jobId: string, message: string) => {
  await ProcessingJob.updateOne({ _id: jobId }, { progressMessage: message });
};

export const processJob = async (jobId: string) => {
  const job = await ProcessingJob.findById(jobId);
  if (!job || job.status !== 'processing') {
    return;
  }

  try {
    await updateProgress(jobId, 'Downloading file from storage...');
    const fileBuffer = await getObjectBuffer(job.fileKey);

    await updateProgress(jobId, 'Processing file contents...');
    let pages;
    let sourcePdfUrl: string | undefined;
    let sourceImageUrl: string | undefined;

    if (job.fileType === 'application/pdf') {
      pages = await processPdf(fileBuffer);
      sourcePdfUrl = job.fileUrl;
    } else if (job.fileType.startsWith('image/')) {
      sourceImageUrl = job.fileUrl;
      pages = await processImage(fileBuffer, job.fileType, sourceImageUrl);
    } else {
      throw new Error('Unsupported file type.');
    }

    if (!pages || pages.length === 0) {
      throw new Error('Could not extract content from the file.');
    }

    await updateProgress(jobId, 'Summarizing sections...');
    const summaries = await generateDoodleSummary(pages, (message: string) => {
      updateProgress(jobId, message).catch(() => null);
    });

    await updateProgress(jobId, 'Creating notebook view...');
    const notebookContent = await generateNotebookSummary(summaries);

    await updateProgress(jobId, 'Generating final summary...');
    const totalSummary = await generateTotalSummary(summaries);

    await updateProgress(jobId, 'Creating mini-exercise...');
    const miniExercise = await generateMiniExercise(summaries);

    const documentData = {
      fileName: job.fileName,
      sourcePdfUrl,
      sourceImageUrl,
      pdfPages: pages,
      chunkSummaries: summaries,
      notebookSummary: notebookContent,
      totalSummary,
      miniExercise,
      userNotes: [],
      userId: job.userId,
      createdAt: new Date(),
    };

    const newDocument = new DocumentModel(documentData);
    const savedDocument = await newDocument.save();

    try {
      const activity = new Activity({
        userId: job.userId,
        icon: 'summarizer',
        text: `Summarized the document: ${job.fileName}`,
      });
      await activity.save();
    } catch (activityError) {
      console.error('Failed to log activity:', activityError);
    }

    await ProcessingJob.updateOne(
      { _id: jobId },
      {
        status: 'completed',
        documentId: savedDocument._id,
        finishedAt: new Date(),
        progressMessage: 'Completed',
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await ProcessingJob.updateOne(
      { _id: jobId },
      { status: 'failed', error: message, finishedAt: new Date() }
    );
  }
};
