import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { client } from "../config/aws/S3Client";
import path from "path";
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "fs";
import { Readable } from "stream";
import { correctPathForWindows } from "../utils/correctPathForWindows";

// function webReadableStreamToNodeReadable(webReadableStream: ReadableStream<any>) {


//     return new Readable({
//         async read() {
//             const reader = webReadableStream.getReader();
//             try {
//                 while (true) {
//                     const { done, value } = await reader.read();
//                     if (done) {
//                         this.push(null);
//                         break;
//                     }
//                     this.push(Buffer.from(value));
//                 }
//             } catch (error) {
//                 this.emit('error in function', error);
//                 reader.releaseLock();
//             } finally {
//                 reader.releaseLock()
//             }
//         }
//     });
// }

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

// output/${prefix}
export async function downloadS3Folder(prefix: string) {

    const command = new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET_NAME,
        Prefix: prefix
    });

    try {
        const { Contents } = await client.send(command);

        const allObjectPromises = Contents?.map(async ({ Key }) => {

            return new Promise(
                async (resolve) => {
                    if (!Key) {
                        resolve("");
                        return;
                    }
                    // console.log("__dirname", __dirname);
                    const finalOutputPath = path.join(__dirname, "..", Key)
                    const outputFileWriteStream = createWriteStream(finalOutputPath)

                    // create directories recursively if they dont exist yet
                    const dirName = path.dirname(finalOutputPath)
                    if (!existsSync(dirName)) {
                        mkdirSync(dirName, { recursive: true })
                    }

                    const getObjCommand = new GetObjectCommand({
                        Bucket: process.env.S3_BUCKET_NAME,
                        Key: Key,
                    });

                    try {
                        const { Body } = await client.send(getObjCommand);

                        if (Body) {
                            const bodyInReadableStreamType = Body.transformToWebStream()
                            const nodeReadableStream = webReadableStreamToNodeReadable(bodyInReadableStreamType)
                            nodeReadableStream.pipe(outputFileWriteStream).on("finish", () => {
                                console.log(`copied successfully ${Key}`);
                                resolve("")
                            })
                            // outputFileWriteStream.on('finish', () => {
                            //     console.log('Copied successfully');

                            // })
                        } else {
                            console.log("Body undefined");
                        }


                    } catch (error) {
                        console.log("error getting obj from s3", error);
                    }
                }
            )


        }) || []
        console.log("awaiting")

        await Promise.all(allObjectPromises.filter(x => x !== undefined))

    } catch (err) {
        console.error(err);
    }
}

export function copyFinalDist(id: string): void {
    const folderPath = path.join(__dirname, "..", "output", `${id}`, "build")
    console.log("folderPath", folderPath);

    const allFiles = getAllFiles(folderPath)
    allFiles.forEach(file => {
        // const dirPathString = path.join("dist", `${id}`, file.slice(folderPath.length + 1), file)
        // console.log("dirPathString", dirPathString);
        uploadFile(`dist/${id}/` + correctPathForWindows(file.slice(folderPath.length + 1)), correctPathForWindows(file))
    })

}

export function getAllFiles(folderPath: string): string[] {
    let response: string[] = []

    const allFilesAndFolders = readdirSync(folderPath)
    allFilesAndFolders.forEach(file => {
        const fullFilePath = path.join(folderPath, file);
        if (statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath))
        } else {
            response.push(fullFilePath)
        }
    })

    return response
}

export const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = readFileSync(localFilePath)
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