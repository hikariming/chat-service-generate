
// import { execSync } from "child_process";
import { HttpsProxyAgent } from "https-proxy-agent";
import { config } from "dotenv";
import OpenAI from "openai";
import { ENV_FILE_PATH } from "./openaikey.js";
import fs from 'fs';

config({ path: ENV_FILE_PATH });
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PROXY_URL = "http://127.0.0.1:1087";
export async function generateMongoSchema() {
    console.log('Generating MongoDB schema...');

    const inquirer = await import('inquirer').then(module => module.default);

    const questions = [
        {
            type: 'input',
            name: 'modelName',
            message: '请为MongoDB模型指定一个名称:'
        },
        {
            type: 'input',
            name: 'attributes',
            message: '请列出模型的属性和类型，使用逗号分隔（例如：name:String,age:Number）:'
        }
    ];

    const answers = await inquirer.prompt(questions);

    const agent = new HttpsProxyAgent(PROXY_URL);
    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
        httpAgent: agent
    });

    try {
        const gptResponse = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that generates MongoDB schemas based on user input.'
                },
                {
                    role: 'user',
                    content: `Generate a MongoDB schema for a model named "${answers.modelName}" with the following attributes: ${answers.attributes}`
                }
            ],
            model: 'gpt-3.5-turbo'
        });

        if (gptResponse.choices && gptResponse.choices[0] && gptResponse.choices[0].message) {
            const generatedSchema = gptResponse.choices[0].message.content.trim();
            console.log('Generated Schema:', generatedSchema);

            // Save schema to a file
            const schemaDirectory = './schemas';
            if (!fs.existsSync(schemaDirectory)) {
                fs.mkdirSync(schemaDirectory);
            }

            fs.writeFileSync(`${schemaDirectory}/${answers.modelName}.js`, generatedSchema);
            console.log(`Schema saved to: ${schemaDirectory}/${answers.modelName}.js`);
        } else {
            console.error('Failed to generate the MongoDB schema.');
        }
    } catch (error) {
        console.error('Error calling OpenAI:', error);
    }
}

export async function generateCRUD(answers) {
    console.log('Generating CRUD interface...');

    // 1. 根据用户的选择生成 CRUD 接口
    // 2. 使用 OpenAI API 获取 CRUD 示例代码
    // 3. 将 CRUD 代码保存到相应的文件或项目中
}