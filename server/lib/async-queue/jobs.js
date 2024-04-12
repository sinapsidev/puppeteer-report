const Queue = require('bull');
const { uploadDocumentOnS3, getPresignedUrl, getMailAddress, sendMail } = require('./mailingAWS.js');

const MAX_CONCURRENT_PROCESS = 2
const REDIS_HOST = '192.168.0.40'
// const REDIS_HOST = '127.0.0.1'  per il test in locale
const DEFALUT_NOTIFY = false


module.exports = (function () {
    function SingletonClass() {
        return new Queue('printing-jobs-queue', {
            redis: { host: REDIS_HOST, port: '6379', },
            limiter: { max: 10, duration: 10000 },      // venfgono eseguiti al massimo max job ogni duration
        });
    }
    var printingJobsQueue;

    return {
        getQueue: function () {
            if (printingJobsQueue == null) {
                printingJobsQueue = new SingletonClass();
                printingJobsQueue.constructor = null;
            }
            return printingJobsQueue;
        },
        startJob: async function (jobData, priority = 10) {
            if (!printingJobsQueue) this.getQueue();
            const job = await printingJobsQueue.add(jobData, { priority });
            return {
                jobId: job.id,
                status: await job.getState(),
            }
        },
        startWorker: async function (print) {
            if (!printingJobsQueue) this.getQueue();
            printingJobsQueue.process(MAX_CONCURRENT_PROCESS, async (job, done) => {
                job.progress(0);

                if (job.data['printerArgs']) {
                    const result = await print(job.data.printerArgs);

                    if (job.data.requireNotification === true) {
                        const { fileName } = uploadDocumentOnS3(job.id, result.buffer)
                        const documentUrl = await getPresignedUrl(fileName);

                        const mailAddress = getMailAddress(job.data.printerArgs.token);
                        await sendMail(mailAddress, documentUrl, job.data.printerArgs);
                    }

                    job.progress(100);
                    done(null, result.buffer);
                }
                else {
                    job.progress(100);
                    done(null, 'Nothing to process');
                }
            })
            console.log(`Worker job started`);
        },
        getJob: async function (id) {
            if (!printingJobsQueue)
                throw new Error("No process queue instanciated");
            const job = await printingJobsQueue.getJob(id);
            if (job)
                return job;
            else
                throw new Error("No job with id " + id);
        },
        getJobStatus: async function (id) {
            if (!printingJobsQueue)
                throw new Error("No process queue instanciated");
            const job = await printingJobsQueue.getJob(id)
            if (job)
                return await job.getState();
            else
                throw new Error("No job with id " + id);
        },
        getJobResult: async function (id) {
            if (!printingJobsQueue)
                throw new Error("No process queue instanciated");
            const job = await printingJobsQueue.getJob(id)
            if (job) {
                const state = await job.getState();
                if (state === "completed")
                    return job.returnvalue
                else
                    throw new Error("Job with id " + id + " is not completed");
            }
            else
                throw new Error("No job with id " + id);
        },
        defaultNotify: DEFALUT_NOTIFY,
    };
})();