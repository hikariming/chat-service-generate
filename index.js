
function generateService(answers) {
    
    if (answers.framework === 'nestjs') {
        // 使用 @nestjs/cli 生成项目
        const { execSync } = require('child_process');
        execSync('npx @nestjs/cli new my-nestjs-app');

        if (answers.database === 'mongoDB') {
            // 添加 NestJS MongoDB 模块等逻辑
            // ...
        }
        if (answers.generateCRUD) {
            // 自动生成 CRUD 接口的逻辑
            // ...
        }
    }
    // 之后可以扩展其他框架和数据库选项
}



async function main() {
    const inquirer = await import('inquirer').then(module => module.default);

    const questions = [
        {
            type: 'list',
            name: 'usageMode',
            message: '选择您的使用模式 please choose:',
            choices: ['新建项目(new project)', '在现有项目中使用(using in existing project)'],
            default: '在现有项目中使用(using in existing project)'
        },
        {
            type: 'input',
            name: 'projectDescription',
            message: '请描述这个新项目 (Please describe the new project):',
            when: answers => answers.usageMode === '新建项目(new project)'
        },
        {
            type: 'list',
            name: 'framework',
            message: '选择您的架构:',
            choices: ['nestjs+mongo'],
            default: 'nestjs+mongo',
            when: answers => answers.usageMode === '在现有项目中使用(using in existing project)'
        },
        {
            type: 'list',
            name: 'ChooseFunction',
            message: '选择您的功能:',
            choices: ['生成mongo schema','生成CRUD接口'],
            default: true,
            when: answers => answers.usageMode === '在现有项目中使用(using in existing project)'
        }
    ];

    const answers = await inquirer.prompt(questions);
    console.log(answers);
    // 根据用户的选择进行操作
    switch (answers.usageMode) {
        case '新建项目(new project)':
            // 如果是新项目，可能还需要询问其他问题
            createNewProject(answers);
            break;
        case '在现有项目中使用(using in existing project)':
            switch (answers.ChooseFunction) {
                case '生成mongo schema':
                    generateMongoSchema(answers);
                    break;
                case '生成CRUD接口':
                    generateCRUD(answers);
                    break;
            }
            break;
    }
    // generateService(answers);
}


async function createNewProject(answers) {
    console.log('Creating new project...');

    // 1. 可以使用 @nestjs/cli 或其他工具生成新项目
    // 2. 使用 OpenAI API 根据项目描述生成初始代码
    // 3. 将代码保存到文件或项目中
}

async function generateMongoSchema(answers) {
    console.log('Generating MongoDB schema...');

    // 1. 可能需要进一步询问用户模型和属性的详细信息
    // 2. 使用 OpenAI API 生成相应的 MongoDB schema
    // 3. 将 schema 代码保存到相应的文件中
}

async function generateCRUD(answers) {
    console.log('Generating CRUD interface...');

    // 1. 根据用户的选择生成 CRUD 接口
    // 2. 使用 OpenAI API 获取 CRUD 示例代码
    // 3. 将 CRUD 代码保存到相应的文件或项目中
}



main();
