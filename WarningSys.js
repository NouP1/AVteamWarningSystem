const TelegramApi = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs');
const moment = require('moment');

const token = process.env.TOKEN;
const channelID = '-1002223805659'


const bot = new TelegramApi(token, { polling: true });

const urls = [
    { url: 'http://185.81.114.84/index', name: 'Бином v2' },
    { url: 'http://185.117.91.209/admin', name: 'Кейтаро' },
    { url: 'http://185.80.53.80/n7crq.php', name: 'Основной Бином' }
];

async function checkUrls() {

 for (let { url, name } of urls) {
     try { 
            const response = await axios.get(url);
            if (response.status !== 200 && url !== 'http://185.117.91.209/admin') {
                await bot.sendMessage(channelID, `Ошибка: ${name} (${url}) вернул статус ${response.status}`);
            } else {
                if (url === 'http://185.117.91.209/admin') {
                     // Проверка наличия элемента <app-login>
                   
                }
            }
          
        } catch (error) {
            if (url==='http://185.117.91.209/admin') {

                if (error.response && error.response.data && !error.response.data.includes('<app-login')) {
                    await bot.sendMessage(channelID, `Ошибка: ${name} (${url}) не содержит форму авторизации\n ${JSON.stringify(error.response, null, 2)}`);
                }
            } else {
                await bot.sendMessage(channelID, `Ошибка: ${name} (${url}) недоступен. Ошибка: ${error.message}`);
            }
            
        }
    }

    }
   

function checkDomainExpirations() {
    try {
        fs.readFile('domains.json', 'utf8', (err, data) => {
            if (err) {
                console.error(`Ошибка чтения файла: ${err.message}`);
                return;
            }
    
            const domains = JSON.parse(data);
            const notifications = [];
    
            domains.forEach(({ domain, expirationDate }) => {
                const expirationMoment = moment(expirationDate, 'YYYY-MM-DD');
    
                
                const oneDayBeforeExpiration = expirationMoment.clone().subtract(1, 'days');
                if (moment().isSame(oneDayBeforeExpiration, 'day')) {
                    notifications.push({ domain, expirationDate, daysBefore: 1 });
                }
    
                const fiveDaysBeforeExpiration = expirationMoment.clone().subtract(5, 'days');
                if (moment().isSame(fiveDaysBeforeExpiration, 'day')) {
                    notifications.push({ domain, expirationDate, daysBefore: 5 });
                }
    
                const tenDaysBeforeExpiration = expirationMoment.clone().subtract(10, 'days');
                if (moment().isSame(tenDaysBeforeExpiration, 'day')) {
                    notifications.push({ domain, expirationDate, daysBefore: 10 });
                }
            });
    
            notifications.forEach(async ({ domain, expirationDate, daysBefore }) => {
                if (daysBefore===1){
                    await bot.sendMessage(channelID, `Оповещение: Домен ${domain} должен быть оплачен до завтра (остался ${daysBefore} день)`);
                }
                else{
                    await bot.sendMessage(channelID, `Оповещение: Домен ${domain} должен быть оплачен до ${expirationDate} (осталось ${daysBefore} дней)`);
                }
                
            });
        });
    
}catch(error) {
    console.log(`Произошла ошибка при проверке доменов\n ${error} `)

}
}
// Запускаем проверку URL каждую минуту
cron.schedule('*/3 * * * *', () => {
    const now = moment().format('YYYY-MM-DD HH:mm:ss')
    checkUrls();
    console.log('Проверка URL выполнена  '+now);
});


cron.schedule('0 9  * * *', () => {
        const now = moment().format('YYYY-MM-DD HH:mm:ss')
        checkDomainExpirations();
        console.log('----------------------------------------------------------------\nПроверка сроков оплаты доменов выполнена  '+now +'\n----------------------------------------------------------------');
    });
