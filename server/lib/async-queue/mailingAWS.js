const fetch = require('node-fetch');
const AWS = require('aws-sdk');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { decodeToken } = require('./tokenHelper');

const client = new S3Client();
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'snps-puppeteer-reports';
const S3_REGION = process.env.S3_REGION || 'eu-central-1';
const MAILING_SERVER_URL = process.env.MAILING_SERVER_URL || 'https://logicadev2.snps.it/';
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY || '';
const s3 = new AWS.S3({
  region: S3_REGION,
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
});
const TTL = 86400;

// ttl 24 h
module.exports.uploadDocumentOnS3 = function uploadDocumentOnS3 (jobId, fileContent) {
  try {
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: `job-${jobId}-document.pdf`,
      Body: fileContent
    };

    s3.upload(params, (err) => {
      if (err) {
        throw Error('Error uploading file:', err);
      } else {
        console.log('uploaded file: ', params.Key);
      }
    });

    return {
      fileName: params.Key
    };
  } catch (e) {
    console.log('Error uploading document to s3:', e);
  }
};

// valido 24 h
module.exports.getPresignedUrl = async function getPresignedUrl (fileName) {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileName
    });
    const url = await getSignedUrl(client, command, { expiresIn: TTL });

    return url;
  } catch (e) {
    console.log('Error generating presigned url:', e);
  }
};

module.exports.getMailAddress = function getMailAddress (token) {
  const tokenDecoded = decodeToken(token);
  console.log(tokenDecoded);
  return tokenDecoded.email;
};

module.exports.sendMail = async function sendMail (address, url, args) {
  const { tenantId, token, timeZone } = args;
  const mail = {
    body: mailTemplate(url),
    mailto: address,
    sender: 'info@snps.it',
    subject: 'report disponibile',
    userId: null,
    userName: ''
  };

  const res = await fetch(MAILING_SERVER_URL+'services/mail', {
    method: 'POST',
    body: JSON.stringify(mail),
    headers: {
      'Content-Type': 'application/json',
      'Time-Zone': timeZone,
      'X-suffisso': tenantId,
      Authorization: 'Bearer ' + token
    }
  });
  console.log('notified ' + address + ' with status ' + res.status);
};

module.exports.ttl = TTL;

// TODO: cambiare il template del corpo e l'oggetto della mail
function mailTemplate (url) {
  return `Il report richiesto è disponibile al seguente link \n${url}`;
}
