import { execSync } from "child_process";
import { config } from "dotenv";
import { ENV_FILE_PATH } from "./openaikey.mjs";
import OpenAI from "openai";
import { HttpsProxyAgent } from "https-proxy-agent"; // 使用HttpsProxyAgent而不是HttpProxyAgent
import { spawn } from "child_process";

config({ path: ENV_FILE_PATH });
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PROXY_URL = "http://127.0.0.1:1087"; // 你的代理地址

export async function createNewProject(answers) {
  console.log("Creating new project...");

  // 检查 @nestjs/cli 是否已经安装
  try {
    execSync("nest --version", { stdio: "ignore" }); // 使用 'ignore' 防止输出到控制台
  } catch (error) {
    console.error(
      "Error: @nestjs/cli seems to be not installed. Please install it by running `npm install -g @nestjs/cli`."
    );
    return;
  }

  if (!OPENAI_API_KEY) {
    throw new Error(
      "No OpenAI API key found. Please make sure it's defined in your .env file."
    );
  }
  const agent = new HttpsProxyAgent(PROXY_URL);

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    httpAgent: agent, // 将代理agent传递给OpenAI SDK
  });

  try {
    console.log("Start to chat with GPT...");
    const gptResponse = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates shell commands for creating NestJS projects.",
        },
        {
          role: "user",
          content: `Given a project description "${answers.projectDescription}", generate a shell command for creating a new NestJS project. The expected command format is " \`\`\` npx @nestjs/cli new PROJECT_NAME". Please infer the PROJECT_NAME from the given project description.\`\`\``,
        },
      ],
      model: "gpt-3.5-turbo", // 使用适当的模型
    });
    console.log("GPT response:", gptResponse);

    if (
      gptResponse.choices &&
      gptResponse.choices[0] &&
      gptResponse.choices[0].message
    ) {
      const generatedCommand = gptResponse.choices[0].message.content.trim();
      console.log("Generated command:", generatedCommand);
      // 使用正则表达式匹配命令字符串
      const commandPattern = /```(?:shell|bash)?\s*([\s\S]*?)```/;
      const matches = generatedCommand.match(commandPattern);

      if (matches && matches[1]) {
        const extractedCommand = matches[1].trim(); // 这里的trim()是为了确保输出没有多余的空白字符
        console.log(extractedCommand);
        const inquirer = await import("inquirer").then(
          (module) => module.default
        );

        // 询问用户是否要运行此命令
        const confirmation = await inquirer.prompt([
          {
            type: "confirm",
            name: "runCommand",
            message: `Do you want to run the above command?`,
            default: false,
          },
        ]);

        if (confirmation.runCommand) {
          try {
            // 使用spawn来执行命令并允许用户进行实时交互
            const commandParts = extractedCommand.split(" ");
            const mainCommand = commandParts.shift(); // 主命令，例如 'npx'

            const subprocess = spawn(mainCommand, commandParts, {
              stdio: "inherit",
            }); // 使用 'inherit' 使得子进程可以使用父进程的 stdin、stdout 和 stderr

            subprocess.on("close", (code) => {
              if (code !== 0) {
                console.error(`Command exited with code ${code}`);
              } else {
                console.log("Command executed successfully.");
              }
            });
          } catch (execError) {
            console.error("Error executing the command:", execError);
          }
        } else {
          console.log("Command not executed.");
        }
      } else {
        console.error("Command not found in the response.");
      }
    } else {
      console.error("Error fetching response from OpenAI.");
    }
  } catch (error) {
    console.error("Error calling OpenAI:", error);
  }
}
