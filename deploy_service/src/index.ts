import { commandOptions, createClient } from "redis"
import { copyFinalDist, downloadS3Folder } from "./services/aws";
import { buildProject } from "./utils/buildProject";



const subscriber = createClient()
subscriber.connect().then(() => {
    console.log("subscriber connected to redis");
})

const publisher = createClient()
publisher.connect().then(() => {
    console.log("publisher connected to redis");
})

async function main() {
    while (1) {
        const response = await subscriber.brPop(
            commandOptions({ isolated: true }),
            'build-queue',
            0
        )
        console.log(response);
        // @ts-ignore
        const id: string = response.element;

        await downloadS3Folder(`output/${id}`)
        console.log("downloaded");

        try {
            await buildProject(id)
            console.log("done building");
        } catch (error) {
            console.log("error in building", error);
        }

        copyFinalDist(id)
        publisher.hSet("status", id, "deployed")
    }
}

main()