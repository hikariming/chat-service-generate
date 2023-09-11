import { startOpenAI } from "./openaikey.mjs";
import fs from "fs";
import inquirer from 'inquirer';
import path from 'path';


function GetCodeFromGPTResponse(text,FilePath) {

// 正则表达式用于匹配\`\`\`后的任何字符，直到另一个\`\`\`出现
const regex = /```[\s\S]*?```/g;
const matchedCode = text.match(regex);

if (matchedCode) {
  // 将\`\`\`和语言标识符（如typescript）从代码字符串中移除
  const cleanedCode = matchedCode[0].replace(/```[a-zA-Z]*\n/, "").replace(/```/, "");
  // save code to moduleContent file
   // 打开现有的File以获取其当前内容
   const existingContent = fs.readFileSync(FilePath, 'utf8');
  
   // 添加GPT-3生成的代码到现有的moduleFile内容中
   const newContent = existingContent + '\n' + cleanedCode;
 
   // 保存新的moduleFile内容
   fs.writeFileSync(FilePath, newContent, 'utf8');
   console.log(cleanedCode);

 
   console.log(`GPT-3 generated code has been saved to ${FilePath}`);
   
} else {
  console.log("No code found");
}

}

export async function generateMongoSchema() {
  console.log("Generating MongoDB schema...");
  const openai = await startOpenAI()

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
  console.log(answers);

  const currentWorkingDir = process.cwd(); // 获取当前工作目录
  const srcDirectoryPath = path.join(currentWorkingDir, './src');
  const schemaDirectoryPath = path.join(currentWorkingDir, './src/schemas');

  // 获取./src下的所有nest文件夹
  const srcFolders = fs.readdirSync(srcDirectoryPath).filter(folder => 
    fs.statSync(path.join(srcDirectoryPath, folder)).isDirectory()
  );

  // 获取./schemas下的所有文件
  const schemaFiles = fs.readdirSync(schemaDirectoryPath).filter(file => 
    fs.statSync(path.join(schemaDirectoryPath, file)).isFile()
  );

  // 创建问题数组
  const questions = [
    {
      type: 'list',
      name: 'selectedSrcFolder',
      message: '请选择一个nest模块(如没有，则需要运行nest generate resource XXX 创建文件夹)：',
      choices: srcFolders
    },
    {
      type: 'list',
      name: 'selectedSchemaFile',
      message: '请选择一个schema文件：',
      choices: schemaFiles
    }
  ];

  // 获取用户的选择
  const { selectedSrcFolder, selectedSchemaFile } = await inquirer.prompt(questions);

  // 拼接完整路径
  const selectedSrcFolderPath = path.join(srcDirectoryPath, selectedSrcFolder);
  const selectedSchemaFilePath = path.join(schemaDirectoryPath, selectedSchemaFile);

  // 在这里进行下一步操作
  console.log(`选中的nest文件夹路径：${selectedSrcFolderPath}`);
  console.log(`选中的schema文件路径：${selectedSchemaFilePath}`);


  const isDirectory = (path) => {
    try {
      return fs.statSync(path).isDirectory();
    } catch (error) {
      return false;
    }
  };
  // // 1. 检查是否存在对应的文件和文件夹
  const moduleFile = path.join(selectedSrcFolderPath, `${selectedSrcFolder}.module.ts`)
  const controllerFile = path.join(selectedSrcFolderPath, `${selectedSrcFolder}.controller.ts`)
  const serviceFile = path.join(selectedSrcFolderPath, `${selectedSrcFolder}.service.ts`)
  if (
    !isDirectory(selectedSrcFolderPath) ||
    !fs.existsSync(controllerFile) ||
    !fs.existsSync(serviceFile) ||
    !fs.existsSync(moduleFile)
  ) {
    console.log(`缺少必要的文件或文件夹，请先运行nest generate resource ${resourceName}！`)
  }
  console.log('文件校验完成，开始生成！')
  // 补全代码
  const schemaContent = fs.readFileSync(selectedSchemaFilePath, 'utf8');
  let moduleContent = fs.readFileSync(moduleFile, 'utf8');
  const openai = await startOpenAI();

   // 编写prompt
   const prompt = `
   现在有一个nest文件${moduleFile} 代码是:
   ${moduleContent}
   现在有一个文件${selectedSchemaFilePath}，代码是:
   ${schemaContent}
   帮我引入这个mongo的文件，一般方法为：
   1、在import中加入MongooseModule和${selectedSchemaFilePath}的import
   2、在imports内加入相关的import
   直接生成代码
 `;

 const gptResponse = await openai.chat.completions.create({
  messages: [
    {
      role: "system",
      content:
        "You are a helpful assistant that can generate code.",
    },
    {
      role: "user",
      content: prompt,
    },
  ],
  model: "gpt-3.5-turbo", // 使用适当的模型
});
const text = gptResponse.choices[0].message.content.trim()
console.log("GPT response:", text);

GetCodeFromGPTResponse(text,moduleFile)

// 开始生成service
let ServiceContent = fs.readFileSync(serviceFile, 'utf8');

 // 编写prompt
 const promptService = `
 现在有一个nest文件${serviceFile} 代码是:
 ${ServiceContent}
 现在有一个文件${selectedSchemaFilePath}，代码是:
 ${schemaContent}
 我已经在moudle里面加入的对selectedSchemaFilePath的引入，帮我编写CRUD接口：
 1、在import中加入相关import
 2、在构造函数中加入相关的引入
 3、在service中修改相关的方法
 直接生成代码
`;


const gptResponseService = await openai.chat.completions.create({
  messages: [
    {
      role: "system",
      content:
        "You are a helpful assistant that can generate code.",
    },
    {
      role: "user",
      content: promptService,
    },
  ],
  model: "gpt-3.5-turbo", // 使用适当的模型
});
const textService = gptResponse.choices[0].message.content.trim()
console.log("GPT response:", textService);

GetCodeFromGPTResponse(textService,serviceFile)

//开始生成controller

let ControllerContent = fs.readFileSync(controllerFile, 'utf8');

  // 编写prompt
   // 编写prompt
 const promptController = `
 现在有一个nest service文件${serviceFile} 代码是:
 ${ServiceContent}
 现在有一个controller文件${controllerFile}，代码是:
 ${ControllerContent}
 帮我编写${controllerFile}的CRUD Controller接口：
 1、在import中加入相关import
 3、在Controller中修改相关的方法
 直接生成代码
`;

const gptResponseController = await openai.chat.completions.create({
  messages: [
    {
      role: "system",
      content:
        "You are a helpful assistant that can generate code.",
    },
    {
      role: "user",
      content: promptService,
    },
  ],
  model: "gpt-3.5-turbo", // 使用适当的模型
});
const textController = gptResponse.choices[0].message.content.trim()
console.log("GPT response:", textController);

GetCodeFromGPTResponse(textController,controllerFile)


  
}