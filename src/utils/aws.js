import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

/**
 * Uploads a file to S3.
 * @param {string} fileName - The name of the file in the local public folder.
 * @returns {Promise<string>} - The URL of the uploaded file.
 */
const uploadFile = async (fileName) => {
    const filePath = path.join(__dirname, 'public', fileName);
    const fileContent = fs.readFileSync(filePath);
    
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName, // You can customize the S3 key if needed
        Body: fileContent,
        ContentType: 'application/octet-stream',
        ACL: 'public-read'
    };

    try {
        if (!fileName) return new Error('File name is required');
        const data = await s3.upload(params).promise();
        console.log(`File uploaded successfully at ${data.Location}`);
        return data.Location; // Return the URL of the uploaded file
    } catch (err) {
        console.error('Error uploading file:', err);
        fs.unlinkSync(filePath); // Delete the file from the local folder
        throw err;
    }
};

module.exports = { uploadFile };
