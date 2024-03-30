import express from "express"
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import 'dotenv/config'

const app = express()

app.use(express.json())


export const client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_REGION
});

// global route handler for every request for resource
app.get("/*", async (req, res) => {
    const host = req.hostname;
    const id = host.split(".")[0]
    const filePath = req.path;

    const getObjCommand = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `dist/${id}${filePath}`,
    });

    try {
        const { Body } = await client.send(getObjCommand);
        const type = filePath.endsWith("html") ? "text/html" : filePath.endsWith("css") ? "text/css" : "application/javascript"
        res.set("Content-Type", type)

        if (Body) {
            const readableBody = webReadableStreamToNodeReadable(Body.transformToWebStream())
            readableBody.pipe(res)

        } else {
            res.status(404).send("No Body");
        }
    } catch (error) {
        console.log("problem fetching key", error);
        res.status(404).send("No Found");
    }
})

app.listen(3001, () => {
    console.log("Request handler running at port 3001");
})

function webReadableStreamToNodeReadable(webReadableStream: ReadableStream<any>) {
    const reader = webReadableStream.getReader();
    const nodeReadableStream = new Readable({
        async read() {
            try {
                const { done, value } = await reader.read();
                if (done) {
                    this.push(null);
                } else {
                    this.push(Buffer.from(value));
                }
            } catch (error) {
                this.emit('error', error);
                reader.releaseLock();
            }
        }
    });
    nodeReadableStream.on('end', () => reader.releaseLock());
    return nodeReadableStream;
}