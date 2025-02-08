import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export function log(message) {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const formattedDate = `${day}-${month}-${year}`;
    const filePath = path.join("./logs/", `${formattedDate}.ans`);

    const time = date.toLocaleTimeString();

    fs.appendFile(filePath, `${chalk.gray(`[${time}]`)} ${message.trim()}\n`, (err) => {
        if (err) {
            console.error(`Failed to write to log file: ${err.message}`);
        }
    });
}