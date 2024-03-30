import { exec, spawn } from "child_process";
import path, { join } from "path";

// export function buildProject(id: string) {
//     console.log("starting");
//     return new Promise((resolve, reject) => {
//         const child = exec(`cd ${join(__dirname, "..", `output/${id}`)} && npm install && npm run build`)

//         child.stdout?.on("data", (data) => {
//             console.log("stdout: " + data);
//         })

//         child.stderr?.on("data", (data) => {
//             console.log("stderr: " + data);
//         })

//         child.on("close", (code) => {
//             console.log("stdout: " + code);
//             resolve("")
//         })
//     })
// }

export function buildProject(id: string) {
    console.log("Starting build...");

    return new Promise((resolve, reject) => {
        const projectPath = path.resolve(__dirname, "..", `output/${id}`);
        const npmInstallAndBuild = `npm install && npm run build`;

        const child = spawn(npmInstallAndBuild, {
            shell: true,
            cwd: projectPath,
            stdio: "inherit" // Pipe child process's output to the parent process
        });

        child.on("close", (code) => {
            if (code === 0) {
                console.log("Build successful.");
                resolve("");
            } else {
                console.error(`Build failed with code ${code}.`);
                reject(new Error(`Build failed with code ${code}.`));
            }
        });
    });
}