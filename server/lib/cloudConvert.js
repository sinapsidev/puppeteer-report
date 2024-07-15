const CloudConvert = require('cloudconvert');
const { buffer } = require('stream/consumers');
require('dotenv').config();


if(!process.env.CLOUDCONVERT_API_KEY) {
    throw new Error("CLOUDCONVERT api key NOT found");
}
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

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