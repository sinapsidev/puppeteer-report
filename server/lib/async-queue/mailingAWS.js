/*
*       Theese functions are an alternative to get results from the async calls
*       When a job is completed the PDF is uploaded to an s3 bucket with a ttl of 1 day
*       A mail is then sent to the user that asked for the file with a presigned link (expiring in 1 day) to it
*/
const AWS = require('aws-sdk');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { decodeToken } = require('./tokenHelper');

let s3 = new AWS.S3();
const client = new S3Client();
const S3_BUCKET_NAME = 'snps-puppeteer-reports';
const S3_REGION = 'eu-central-1';
const MAILING_SERVER_URL = 'https://logicadev2.snps.it/services/mail';
const TTL = 86400;

// ttl 24 h
module.exports.uploadDocumentOnS3 = function uploadDocumentOnS3(jobId, fileContent) {
    try {
        const params = {
            Bucket: S3_BUCKET_NAME,
            Key: `job-${jobId}-document.pdf`,
            Body: fileContent,
        };

        s3.upload(params, (err) => {
            if (err) {
                throw Error('Error uploading file:', err);
            }
            else {
                console.log('uploaded file: ', params.Key);
            }
        });

        return {
            fileName: params.Key
        }
    } catch (e) {
        console.log('Error uploading document to s3:', e);
    }

}

// valido 24 h
module.exports.getPresignedUrl = async function getPresignedUrl(fileName) {
    try {
        // const url = s3.getSignedUrl('getObject', {
        //     Bucket: S3_BUCKET_NAME,
        //     Key: fileName,
        //     Expires: 86400,
        // })

        const command = new GetObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: fileName,
        });
        const url = await getSignedUrl(client, command, { expiresIn: TTL });

        return url
    } catch (e) {
        console.log('Error generating presigned url:', e);
    }
}

module.exports.getMailAddress = function getMailAddress(token) {
    const tokenDecoded = decodeToken(token);
    console.log(tokenDecoded)
    return tokenDecoded.email
}

module.exports.sendMail = async function sendMail(address, url, args) {
    const { tenantId, token, timeZone } = args;
    const mail = {
        body: mailTemplate(url),
        mailto: address,
        sender: "info@snps.it",
        subject: "report disponibile",
        userId: null,
        userName: "",
    }

    const res = await fetch(MAILING_SERVER_URL, {
        method: "POST",
        body: JSON.stringify(mail),
        headers: {
            "Content-Type": "application/json",
            'Time-Zone': timeZone,
            'X-suffisso': tenantId,
            'Authorization': 'Bearer ' + token,
        }
    })
    console.log('notified '+address+' with status '+es.status)
}

module.exports.ttl = TTL;

// TODO: cambiare il template del corpo e l'oggetto della mail
function mailTemplate(url) {
    return `Il report richiesto è disponibile al seguente link \n${url}`;
}