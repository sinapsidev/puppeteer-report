const CloudConvert = require('cloudconvert');
const { buffer } = require('stream/consumers');
require('dotenv').config();

const CLOUDCONVERT = process.env.CLOUDCONVERT_API_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYWI0ODUzYmQxNGIyOGNhYzI5YjhhOTEyYjBmYWE1N2U2NTU4YTUyYjU2YmMzYjg5Yjg3M2VhMjNlZmJhNjNjMDM3ZTNiZWUzMWZmM2I1MDgiLCJpYXQiOjE3MTg4OTIzMjAuMzc0NDg0LCJuYmYiOjE3MTg4OTIzMjAuMzc0NDg2LCJleHAiOjQ4NzQ1NjU5MjAuMzcxNzA2LCJzdWIiOiI2ODU1OTU0OCIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ1c2VyLndyaXRlIiwidGFzay5yZWFkIiwidGFzay53cml0ZSJdfQ.BuDH7Vl0WCLeqmYjVae0vKSmZMJs8ZiWuOly9MF80JGCaxur7vPH9cTU0XE00e4p9hAPA6uuey8DK5k71Y_qkY6YqOuI76ksRHiE3S8aknLDlrXBFLsOiOqz_HRS1VmkQNqPObadeSmr9PqSUMt01kkz1glJRSZ_mDCaTOGRQYa3Q2UOG6sEfEsJmOqkJN_K-82Tn-0RnwjTs16epGw0BPLeroyi6zY-ZbjPmqUaStPzYsCnbK4Of5RmAYheSO-dDQobJ7UR3tBBJ3WFzFlDQ25LGYHcKUZ715r6Evm7cEsjWTYebBFe0lvVnLMdgcnfn2vL0d0mpoZ8uILP-GusuXBJliC254_lnqSMFfEQGl98ZCHy6XT7cUGODVB7mWHIxK7-RsziMO_OR8R9l-UZp4I_V4QkF5WDaessJB2NtHfIjYbvPekFmRSyxz9SrHEN_zoond-Ww9eBqJmPbKrf9SFzmrOVZFpvbbg6-eRTlbuSB978fbUNoQDGM2CbhISlVv6bP_WeEo69QrV0zxOZJ8MPpbyeAhD2sVi0zyro_PfY_GPS49ZBd0ZATEmOsL3FQj_Zhf5XMzvB9VxpjB8AMLuyMUTUEnu76-08AON-JdpuVlZG8lU1YrD3Sjdtice_uHa2OLC8H76VL-7zWQHJ_9Pfi0D6kUud0SSXJcsJg0o';


if(!CLOUDCONVERT) {
    throw new Error("CLOUDCONVERT api key NOT found");
}
const cloudConvert = new CloudConvert(CLOUDCONVERT);

module.exports = async (pdf, type='docx') => {
    try {
        // create
        const job = await cloudConvert.jobs.create({
            tasks: {
                'import-my-file': {
                    operation: 'import/upload',
                },
                'convert-my-file': {
                    operation: 'convert',
                    input: 'import-my-file',
                    output_format: type
                },
                'export-my-file': {
                    operation: 'export/url',
                    input: 'convert-my-file'
                }
            }
        });

        const uploadTask = job.tasks.filter(task => task.name === 'import-my-file')[0];
        await cloudConvert.tasks.upload(uploadTask, pdf, 'tmp.pdf');

        // wait
        const finishedJob = await cloudConvert.jobs.wait(job.id);
        if (finishedJob.status === 'error') {
            throw 'Conversion failed:', finishedJob.message;
        }
        else {
            const file = cloudConvert.jobs.getExportUrls(finishedJob)[0];
            const res = await fetch(file.url);
            const buff = await buffer(res.body);

            return buff;
        }
    } catch (e) {
        console.log('Error: ', e.message);
    }
}