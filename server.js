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