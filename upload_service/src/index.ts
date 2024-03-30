import express from "express"
import cors from "cors";
import simpleGit from "simple-git"
import path from "path"
import { generate } from "./utils/generateRandomID";
import { getAllFiles } from "./utils/getAllFiles";
import { uploadFile } from "./utils/uploadFile";
import { correctPathForWindows } from "./utils/correctPathForWindows";
import { createClient } from "redis"
const publisher = createClient()
publisher.connect()
publisher.on('connect', () => {
    console.log("Connected to redis ...");
})

const subscriber = createClient()
subscriber.connect().then(() => {
    console.log("subscriber connected to redis");
})

const app = express()
app.use(cors())
app.use(express.json())



app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl;

    const id = generate()
    await simpleGit().clone(repoUrl, path.join(correctPathForWindows(__dirname), `output/${id}`))

    const files = getAllFiles(path.join(correctPathForWindows(__dirname), `output/${id}`))

    const uploadPromises = files.map(file => {
        const relativePath = file.slice(correctPathForWindows(__dirname).length + 1);
        return uploadFile(relativePath, file);
    });
    await Promise.all(uploadPromises);

    publisher.lPush("build-queue", id); // upload is completed so we can push it on the queue
    publisher.hSet("status", id, "uploaded")

    res.status(200).json({ id })
})

app.get("/status", async (req, res) => {
    const id = req.query.id;
    if (id && typeof id === "string") {
        const response = await subscriber.hGet("status", id);
        if (response)
            res.json({
                status: response
            })
        else res.status(500)
    } else {
        res.status(400)
    }

})

app.listen(3000, () => {
    console.log("server started on PORT");
})