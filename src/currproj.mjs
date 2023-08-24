// import { execSync } from "child_process";
import { HttpsProxyAgent } from "https-proxy-agent"; // 使用HttpsProxyAgent而不是HttpProxyAgent
import { config } from "dotenv";
import OpenAI from "openai";
import { ENV_FILE_PATH } from "./openaikey.mjs";
import fs from "fs";
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: ENV_FILE_PATH });
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PROXY_URL = "http://127.0.0.1:1087";
const agent = new HttpsProxyAgent(PROXY_URL);
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  httpAgent: agent, // 将代理agent传递给OpenAI SDK
});


export async function generateMongoSchema() {
  console.log("Generating MongoDB schema...");

  const inquirer = await import("inquirer").then((module) => module.default);

  const questions = [
    {
      type: "input",
      name: "modelName",
      message: "请为MongoDB模型指定一个名称:",
    },
    {
      type: "input",
      name: "description",
      message: "请描述您希望在模型中包含的字段:",
    },
  ];

  const answers = await inquirer.prompt(questions);

  try {
    const gptResponse = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that interprets user descriptions to generate MongoDB schemas in a specific NestJS format.",
        },
        {
          role: "user",
          content: `I need a MongoDB schema for a NestJS project. The model should be named "${answers.modelName}" and the fields are described as: "${answers.description}". I'm expecting the output to look like:
        
        import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
        import { Document } from 'mongoose';
        
        export type ${answers.modelName}Document = ${answers.modelName} & Document;
        
        @Schema()
        export class ${answers.modelName} {
            // Example field (please replace this with actual fields based on description)
            @Prop({ unique: true }) 
            fieldName: string;
        }
        
        export const ${answers.modelName}Schema = SchemaFactory.createForClass(${answers.modelName});
        
        Can you generate this for me in this format?`,
        },
      ],
      model: "gpt-3.5-turbo",
    });
    console.log("GPT response:", gptResponse);

    if (
      gptResponse.choices &&
      gptResponse.choices[0] &&
      gptResponse.choices[0].message
    ) {
      const fullText = gptResponse.choices[0].message.content.trim();

      // 使用正则表达式来分离代码和注释部分
      const codeMatch = fullText.match(/```typescript([\s\S]*?)```/);
      const code = codeMatch ? codeMatch[1].trim() : "";
      const comment = fullText.replace(/```typescript([\s\S]*?)```/, "").trim();

      console.log("Generated Schema:", code);
      console.log("Comment:", comment);

      // Save schema to a file
      const schemaDirectory = "./schemas";
      if (!fs.existsSync(schemaDirectory)) {
        fs.mkdirSync(schemaDirectory);
      }

      const fileContent = `/*\n${comment}\n*/\n\n${code}`;

      fs.writeFileSync(
        `${schemaDirectory}/${answers.modelName}.ts`,
        fileContent
      );
      console.log(
        `Schema saved to: ${schemaDirectory}/${answers.modelName}.ts`
      );
    } else {
      console.error("Failed to generate the MongoDB schema.");
    }
  } catch (error) {
    console.error("Error calling OpenAI:", error);
  }
}

export async function generateCRUD(answers) {
    console.log("Generating CRUD interface...");
    console.log(answers)
    const schemaDirectoryPath = path.join(__dirname, './schemas');

    // 1. 使用nest g resource命令生成CRUD文件夹和基础文件
    const resourceName = answers.resourceName || "haha"; // 假设answers中有资源名称
    execSync(`nest g resource ${resourceName}`, { stdio: 'inherit' });  // 这会显示nest命令的输出给用户
  
    // 2. 询问客户用哪个schemas文件中的schemas数据定义文件
    let chosenSchema;
    try {
      const schemaFiles = await fs.promises.readdir(schemaDirectoryPath);
      const { chosenSchema: chosen } = await inquirer.prompt([
        {
            type: 'list',
            name: 'chosenSchema',
            message: '选择一个schemas数据定义文件:',
            choices: schemaFiles
        }
    ]);
    chosenSchema = chosen;
  } catch (error) {
    console.log(error)
    console.log('could not open the schema file!')
  }
  
    // 加载所选的schemas文件

    
    const schemaContent = await fs.promises.readFile(path.join(schemaDirectoryPath, chosenSchema), 'utf8');
    // console.log("Schema content:", schemaContent);
  
    // 3. 调用OPENAI API改好CRUD代码
    // const openai = new OpenAI(/* your OpenAI setup here */);
    const gptResponse = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that helps in generating CRUD operations for NestJS based on given schema.'
        },
        {
          role: 'user',
          content: `hello`
        }
      ],
      model: 'gpt-3.5-turbo'
    });
    console.log("GPT response:", gptResponse);
  
    const generatedCode = gptResponse.choices?.[0]?.message?.content?.trim();
  
    if (generatedCode) {
      console.log("Generated CRUD Code:", generatedCode);
  
      // 4. 将 CRUD 代码保存到相应的文件或项目中 (这部分取决于你的项目结构和需求)
      // 例如，可以保存到`./resources/${resourceName}/fileName.ts`
      await fs.promises.writeFile(`./resources/${resourceName}/fileName.ts`, generatedCode);  
    } else {
      console.error("Failed to generate CRUD operations.");
    }
  }