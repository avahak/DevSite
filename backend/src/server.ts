import dotenv from 'dotenv';
dotenv.config();
// Tarkistetaan myös, että ainakin muutama tärkein ympäristömuuttuja on määritelty:
if (!process.env.PORT || !process.env.SECRET_KEY || !process.env.KULUVA_KAUSI 
    || !process.env.DB_NAME)
    throw new Error('Missing an environment variable, check server configuration.');

import express from 'express';
import helmet from 'helmet';
import path from 'path';
import cors from 'cors';
import 'express-async-errors';
import { buildTimestamp } from '@shared/buildInfo';
import { currentTimeInFinlandString, dateToYYYYMMDD } from '@shared/generalUtils';

const app = express();

const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL || "";

const serverStartTime = currentTimeInFinlandString();

// Käytetään Helmet kirjastoa parantamaan tietoturvaa, asettaa esim. HTTP headereita:
// app.use(helmet());
// console.log(helmet.contentSecurityPolicy.getDefaultDirectives());
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                'default-src': ["'self'", 'https://www.example.com'],
                'style-src': ["'self'", 'https:', "'unsafe-inline'"],
            },
        },
    }));
// Sallitaan CORS-pyynnöt kaikille lähteille:
app.use(cors());
// Määritetään middleware JSON-parsija:
app.use(express.json());

// Välitä staattisia tiedostoja 'dist' hakemistosta:
app.use(BASE_URL, express.static(path.join(process.cwd(), 'dist'), {
    // maxAge on maksimiaika selaimen välimuistin käytölle (3600000 on yksi tunti). 
    // Huom! Tämän voi poistaa tuotantoversiossa.
    maxAge: 2 * 3600000
}));

// app.use(BASE_URL + '/api', generalRouter);

// Tietoa serveristä:
app.get(BASE_URL + '/info', (_req, res) => {
    const serverTime = currentTimeInFinlandString();
    res.setHeader('Content-Type', 'text/html');
    res.send(`Serverin aika: ${serverTime}<br>Koodi rakennettu: ${buildTimestamp}<br>Serveri käynnistetty: ${serverStartTime}`);
});

// Päivämäärä serverin mukaan:
app.get(BASE_URL + '/date', (_req, res) => {
    const date = dateToYYYYMMDD(new Date());
    res.json({ date });
});

/**
 * Muuten käytetään Reactin omaa reititystä:
 */
const wildcard = BASE_URL ? `${BASE_URL}/*` : '*';
app.get(wildcard, (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// Käynnistetään express.js serveri:
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
