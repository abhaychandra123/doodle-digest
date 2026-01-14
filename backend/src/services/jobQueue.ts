import ProcessingJob from '../models/ProcessingJob';
import { processJob } from './jobProcessor';

const WORKER_INTERVAL_MS = parseInt(process.env.JOB_WORKER_INTERVAL_MS || '2000', 10);
let isPolling = false;

const pollOnce = async () => {
  if (isPolling) return;
  isPolling = true;
  try {
    const job = await ProcessingJob.findOneAndUpdate(
      { status: 'queued' },
      { status: 'processing', startedAt: new Date() },
      { sort: { createdAt: 1 }, new: true }
    );
    if (job) {
      await processJob(job.id);
    }
  } finally {
    isPolling = false;
  }
};

export const startJobWorker = () => {
  setInterval(() => {
    pollOnce().catch(() => null);
  }, WORKER_INTERVAL_MS);
};

export const enqueueJob = async (jobId: string) => {
  await ProcessingJob.updateOne({ _id: jobId }, { status: 'queued' });
};
