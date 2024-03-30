import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import 'dotenv/config'
import fs from "fs"



const client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_REGION
});



export const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath)
    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
    });

    try {
        const response = await client.send(command)
        console.log("response", response);
    } catch (err) {
        console.error("err", err)
    }
}

