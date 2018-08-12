const express = require('express');
const hbs = require('hbs');
const fs = require('fs');

const port = process.env.PORT || 3000;

const app = express();

hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine', 'hbs');

app.use((req, res, next) => {
    let now = new Date().toString();
    let log = `${now}: ${req.method} ${req.url}`;
    console.log(log);
    fs.appendFile('server.log', `${log}\n`, (error) => {
        if (error) {
            console.log(`Could not append to server.log: ${error}`);
        }
    })
    next();
});

// app.use((req, res, next) => {
//     res.render('maintenance.hbs', {
//         pageTitle: `We'll be right back`,
//         maintenanceMessage: 'MAINTENANCE, BE RIGHT BACK'
//     });
// })

app.use(express.static(__dirname + '/public'));

hbs.registerHelper('getCurrentYear', () => {
    return new Date().getFullYear()
})

hbs.registerHelper('screamIt', (text) => {
    return text.toUpperCase();
})

hbs.registerHelper('highlightIt', (text) => {
    return `>>>${text}<<<`;
})

app.get('/', (req, res) => {
    res.render('home.hbs', {
        pageTitle: 'Home Page',
        welcomeMessage: 'Welcome Message!'
    });
})

app.get('/about', (req, res) => {
    res.render('about.hbs', {
        pageTitle: 'About Page',
    });
})

app.get('/projects', (req, res) => {
    res.render('projects.hbs', {
        pageTitle: 'Projects Page',
        projectMessage: 'New Projects - AWESOME'
    });
})

app.get('/bad', (req, res) => {
    res.send({
        errorMessage: 'Something goes wrong'
    })
})

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});

/* BODY CHIEF PART */
const request = require('request');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');

(function bodyChiefAddress() {
    request({
        url: `https://bodychief.pl/menu-na-dzis`,
        headers: {
            Cookie: 'client_city=1'
        }
    }, (error, response, body) => {
        if (error) {
            callback(`Unable to connect to Google: ${error}`);
        } else {
            log(`============== START ${prepareCurrentDate()} ==============`);
            log('Loading data from bodychief.pl...');
            const $ = cheerio.load(body);
            const meals = [];
            meals[0] = [];
            meals[1] = [];
            meals[2] = [];
            meals[3] = [];
            meals[4] = [];            
            parse($, 'Menu: Standard', meals);
            parse($, 'Menu: Sport', meals);
            parse($, 'Menu: Fit Mammy', meals);
            parse($, 'Menu: Junior', meals);
            log('Data loaded.')
            log(`Sending message...`)
            const htmlMessage = createHtmlMessage(meals);
            const to = ['p.prominsky@gmail.com', 'adamczykaa@gmail.com'];
            sendEmail(htmlMessage, to);
            log(`Message sent on`);
            log('Writing to files...');
            writeToFiles(meals);
            log('Files written');
            log(`============== STOP ${prepareCurrentDate()} ==============`)
        }
    });
}());



function log(text) {
    console.log(text);
    fs.appendFile('server.log', `${text}\n`, (error) => {
        if (error) {
            console.log(`Could not append to server.log: ${error}`);
        }
    })
}

function parse($, menu, meals) {
    const menuTable = $(`table:has(h1:contains('${menu}'))`);
    $(menuTable).find('td').each((i, e) => {
        const meal = $(e).find('p').text();
        if (!meals[i].includes(meal)) {
            meals[i].push(meal);
        }
    });
}

function createHtmlMessage(meals) {
    const mapping = ['I Śniadania', 'II Śniadania', 'Obiady', 'Podwieczorki', 'Kolacje']
    let htmlMessage = '<html><body>'
    for (let i = 0; i < meals.length; i++) {
        htmlMessage += `<h2>${mapping[i]}</h2>`
        for (let j = 0; j < meals[i].length; j++) {
            htmlMessage += `<p>${meals[i][j]}</p>`
        }
    }
    return htmlMessage += '</body></html>'
}
function prepareCurrentDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth() < 9 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1);
    const date = d.getDate() < 10 ? '0' + d.getDate(): d.getDate();
    return `${year}-${month}-${date}`;
}

function sendEmail(htmlMessage, to) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'body.chief.mailer@gmail.com',
            pass: '_mailer123'
        }
    });
    
    const mailOptions = {
        from: '"Body Chief Mailer" <body.chief.mailer@gmail.com>',
        to: to,
        subject: `[Body Chief Mailer] Posiłki z dnia: ${prepareCurrentDate()}.`,
        html: htmlMessage
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
    });
}

function writeToFiles(meals) {
    const mapping1 = ['breakfasts', 'brunches', 'dinners', 'teas', 'suppers'];
    for (let i = 0; i < meals.length; i++) {
        const currentFile = `${mapping1[i]}.txt`;
        for (let j = 0; j < meals[i].length; j++) {
            fs.appendFileSync(currentFile, `${meals[i][j]}\n`);
        }
    }
}
