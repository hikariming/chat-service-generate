// import { execSync } from "child_process";
import { HttpsProxyAgent } from "https-proxy-agent";
import { config } from "dotenv";
import OpenAI from "openai";
import { ENV_FILE_PATH } from "./openaikey.mjs";
import fs from "fs";

config({ path: ENV_FILE_PATH });
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PROXY_URL = "http://127.0.0.1:1087";
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

  const agent = new HttpsProxyAgent(PROXY_URL);
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    httpAgent: agent,
  });

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

  // 1. 根据用户的选择生成 CRUD 接口
  // 2. 使用 OpenAI API 获取 CRUD 示例代码
  // 3. 将 CRUD 代码保存到相应的文件或项目中
}
